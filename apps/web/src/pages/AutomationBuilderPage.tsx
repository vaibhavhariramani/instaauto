import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { automationSchema, MatchType, type AutomationInput } from '@instaauto/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ReelSelector } from '@/components/automations/ReelSelector';
import { KeywordInput } from '@/components/automations/KeywordInput';
import { ReplyMessageEditor } from '@/components/automations/ReplyMessageEditor';
import { useInstagramAccounts, useReels } from '@/api/instagram';
import { useAutomation, useCreateAutomation, useUpdateAutomation } from '@/api/automations';
import { useTemplates } from '@/api/templates';
import { extractErrorMessage } from '@/api/client';
import { ROUTES } from '@/constants/routes';

const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  [MatchType.EXACT]: 'Exact match — comment must equal the keyword exactly',
  [MatchType.CONTAINS]: 'Contains — keyword appears anywhere in the comment',
  [MatchType.ANY_KEYWORD]: 'Any keyword — matches a whole word from the list',
};

export default function AutomationBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const { data: accounts, isLoading: accountsLoading } = useInstagramAccounts();
  const { data: existing, isLoading: existingLoading } = useAutomation(id);
  const { data: templates } = useTemplates();
  const createAutomation = useCreateAutomation();
  const updateAutomation = useUpdateAutomation(id ?? '');
  const [templateId, setTemplateId] = useState<string>('');

  const connectedAccount = accounts?.find((a) => a.status === 'CONNECTED');
  const [formReady, setFormReady] = useState(!isEditMode);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AutomationInput>({
    resolver: zodResolver(automationSchema),
    defaultValues: {
      name: '',
      instagramAccountId: '',
      reelId: '',
      triggerKeywords: [],
      matchType: MatchType.CONTAINS,
      replyMessage: '',
      publicReplyEnabled: false,
      publicReplyMessage: '',
      dmOncePerUser: true,
      ignoreCreatorComments: true,
      isActive: true,
    },
  });

  useEffect(() => {
    if (connectedAccount && !watch('instagramAccountId')) {
      setValue('instagramAccountId', connectedAccount.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAccount]);

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        instagramAccountId: existing.instagramAccountId,
        reelId: existing.reelId,
        reelThumbnailUrl: existing.reelThumbnailUrl,
        reelPermalink: existing.reelPermalink,
        reelCaption: existing.reelCaption,
        triggerKeywords: existing.triggerKeywords,
        matchType: existing.matchType,
        replyMessage: existing.replyMessage,
        templateId: existing.templateId,
        publicReplyEnabled: existing.publicReplyEnabled,
        publicReplyMessage: existing.publicReplyMessage,
        dmOncePerUser: existing.dmOncePerUser,
        ignoreCreatorComments: existing.ignoreCreatorComments,
        isActive: existing.isActive,
      });
      if (existing.templateId) setTemplateId(existing.templateId);
      // Defer mounting the real form (in particular the Radix Select bound to matchType) until
      // after reset() has applied the loaded values — mounting it first with the useForm hook's
      // static defaultValues and then transitioning to the loaded value via reset() causes Radix
      // Select to misfire onValueChange('') shortly after mount.
      setFormReady(true);
    }
  }, [existing, reset]);

  const accountId = watch('instagramAccountId');
  const { data: reels, isLoading: reelsLoading } = useReels(accountId || undefined);

  const onSubmit = async (values: AutomationInput) => {
    try {
      if (isEditMode && id) {
        await updateAutomation.mutateAsync(values);
        toast.success('Automation updated');
      } else {
        await createAutomation.mutateAsync(values);
        toast.success('Automation created');
      }
      navigate(ROUTES.automations);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  if (isEditMode && (existingLoading || !formReady)) {
    return <Skeleton className="h-96 w-full" />;
  }

  const isSaving = createAutomation.isPending || updateAutomation.isPending;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.automations)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{isEditMode ? 'Edit automation' : 'New automation'}</h2>
          <p className="text-sm text-muted-foreground">Reply to comments on a specific Reel automatically.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Automation name</Label>
              <Input id="name" placeholder="Free Guide — Reel #1" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            {accounts && accounts.length > 1 && (
              <div className="space-y-2">
                <Label>Instagram account</Label>
                <Controller
                  control={control}
                  name="instagramAccountId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            @{acc.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select a Reel</CardTitle>
          </CardHeader>
          <CardContent>
            {accountsLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <ReelSelector
                reels={reels}
                isLoading={reelsLoading}
                selectedReelId={watch('reelId')}
                onSelect={(reel) => {
                  setValue('reelId', reel.id);
                  setValue('reelThumbnailUrl', reel.thumbnailUrl);
                  setValue('reelPermalink', reel.permalink);
                  setValue('reelCaption', reel.caption);
                }}
              />
            )}
            {errors.reelId && <p className="mt-2 text-xs text-destructive">{errors.reelId.message}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trigger keywords</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Controller
              control={control}
              name="triggerKeywords"
              render={({ field }) => <KeywordInput value={field.value} onChange={field.onChange} />}
            />
            {errors.triggerKeywords && <p className="text-xs text-destructive">{errors.triggerKeywords.message}</p>}

            <div className="space-y-2">
              <Label>Match type</Label>
              <Controller
                control={control}
                name="matchType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(MatchType).map((mt) => (
                        <SelectItem key={mt} value={mt}>
                          {MATCH_TYPE_LABELS[mt]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">DM reply</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {templates && templates.length > 0 && (
              <div className="space-y-2">
                <Label>Start from a template (optional)</Label>
                <Select
                  value={templateId}
                  onValueChange={(v) => {
                    setTemplateId(v);
                    const template = templates.find((t) => t.id === v);
                    if (template) {
                      setValue('replyMessage', template.content);
                      setValue('templateId', template.id);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Controller
              control={control}
              name="replyMessage"
              render={({ field }) => <ReplyMessageEditor value={field.value} onChange={field.onChange} />}
            />
            {errors.replyMessage && <p className="text-xs text-destructive">{errors.replyMessage.message}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Public comment reply</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Reply to the comment publicly</p>
                <p className="text-xs text-muted-foreground">
                  Post a visible reply under the commenter&apos;s comment before sending the DM.
                </p>
              </div>
              <Controller
                control={control}
                name="publicReplyEnabled"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>
            {watch('publicReplyEnabled') && (
              <div className="space-y-2">
                <Label htmlFor="publicReplyMessage">Public reply message</Label>
                <Input
                  id="publicReplyMessage"
                  placeholder="Sent you a DM! 📩 Check your inbox."
                  {...register('publicReplyMessage')}
                />
                {errors.publicReplyMessage && (
                  <p className="text-xs text-destructive">{errors.publicReplyMessage.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Automation logic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Only once per user</p>
                <p className="text-xs text-muted-foreground">Never DM the same commenter twice for this automation.</p>
              </div>
              <Controller
                control={control}
                name="dmOncePerUser"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Ignore your own comments</p>
                <p className="text-xs text-muted-foreground">Don&apos;t trigger a DM when you comment on your own Reel.</p>
              </div>
              <Controller
                control={control}
                name="ignoreCreatorComments"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Turn off to pause this automation without deleting it.</p>
              </div>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(ROUTES.automations)}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" loading={isSaving}>
            <Save className="h-4 w-4" /> {isEditMode ? 'Save changes' : 'Create automation'}
          </Button>
        </div>
      </form>
    </div>
  );
}
