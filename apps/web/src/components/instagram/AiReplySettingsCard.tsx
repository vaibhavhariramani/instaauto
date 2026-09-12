import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { aiReplySettingsSchema, type AiReplySettingsInput } from '@instaauto/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAiReplySettings, useUpdateAiReplySettings } from '@/api/aiReplySettings';
import { extractErrorMessage } from '@/api/client';

export function AiReplySettingsCard({ accountId }: { accountId: string }) {
  const { data: settings, isLoading } = useAiReplySettings(accountId);
  const updateSettings = useUpdateAiReplySettings(accountId);

  const { control, register, handleSubmit, reset } = useForm<AiReplySettingsInput>({
    resolver: zodResolver(aiReplySettingsSchema),
    defaultValues: { enabled: false, personaPrompt: '' },
  });

  useEffect(() => {
    if (settings) reset({ enabled: settings.enabled, personaPrompt: settings.personaPrompt ?? '' });
  }, [settings, reset]);

  const onSubmit = async (values: AiReplySettingsInput) => {
    try {
      await updateSettings.mutateAsync(values);
      toast.success('AI auto-reply settings saved');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  if (isLoading || !settings) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" /> AI auto-reply
        </CardTitle>
        <CardDescription>
          Fires an AI-generated reply for DMs that don&apos;t match any automation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!settings.serverConfigured && (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Add a <code>GROQ_API_KEY</code> or <code>OPENAI_API_KEY</code> on the server to enable
              this — the toggle won&apos;t send replies until then.
            </p>
          )}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ai-enabled">Enable AI auto-reply</Label>
              <p className="text-sm text-muted-foreground">
                Replies to inbound DMs when nothing else handles them.
              </p>
            </div>
            <Controller
              control={control}
              name="enabled"
              render={({ field }) => (
                <Switch id="ai-enabled" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="persona">Persona (optional)</Label>
            <Textarea
              id="persona"
              rows={3}
              placeholder="e.g. Friendly and casual, mixes English and Hindi, keeps replies short."
              {...register('personaPrompt')}
            />
          </div>
          <Button type="submit" variant="gradient" loading={updateSettings.isPending}>
            Save
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
