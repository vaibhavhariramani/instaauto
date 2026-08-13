import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { updateProfileSchema, type UpdateProfileInput } from '@instaauto/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useDeleteAccount, useUpdateNotificationPrefs, useUpdateProfile } from '@/api/me';
import { extractErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { initials } from '@/utils/format';
import { ROUTES } from '@/constants/routes';

function getTimezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Kolkata'];
  }
}

function ProfileTab() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const timezones = useMemo(getTimezones, []);

  const { register, handleSubmit, watch, setValue } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user?.name ?? '', timezone: user?.timezone ?? 'UTC' },
  });

  const onSubmit = async (values: UpdateProfileInput) => {
    try {
      await updateProfile.mutateAsync(values);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your personal information.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-border">
            <AvatarImage src={user.avatarUrl ?? undefined} />
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">Profile photo is managed via your Google account.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-name">Full name</Label>
            <Input id="settings-name" {...register('name')} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={watch('timezone')} onValueChange={(v) => setValue('timezone', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Theme</Label>
            <div>
              <ThemeToggle />
            </div>
          </div>
          <Button type="submit" variant="gradient" loading={updateProfile.isPending}>
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function NotificationsTab() {
  const user = useAuthStore((s) => s.user);
  const updatePrefs = useUpdateNotificationPrefs();
  if (!user) return null;

  const items = [
    { key: 'emailOnDmFailed' as const, label: 'DM failures', description: 'Email me when a DM fails to send.' },
    { key: 'emailOnDisconnect' as const, label: 'Instagram disconnected', description: 'Email me if my Instagram account disconnects.' },
    { key: 'emailWeeklyDigest' as const, label: 'Weekly digest', description: 'A weekly summary of automations and analytics.' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose what InstaAuto emails you about.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              checked={user[item.key]}
              onCheckedChange={(checked) => updatePrefs.mutate({ [item.key]: checked })}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DangerZoneTab() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteAccount = useDeleteAccount();
  const navigate = useNavigate();

  const handleDelete = async () => {
    try {
      await deleteAccount.mutateAsync();
      navigate(ROUTES.home);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Danger zone</CardTitle>
        <CardDescription>Permanently delete your account and all associated data.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
          Delete account
        </Button>
      </CardContent>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete your account?"
        description="This permanently deletes your automations, templates, messages, and Instagram connections. This cannot be undone."
        confirmLabel="Delete my account"
        loading={deleteAccount.isPending}
        onConfirm={handleDelete}
      />
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your profile, notifications, and account.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="danger">Danger zone</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="danger">
          <DangerZoneTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
