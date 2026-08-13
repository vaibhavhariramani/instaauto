import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { updateProfileSchema, type UpdateProfileInput } from '@instaauto/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateProfile } from '@/api/me';
import { extractErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';

function getTimezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Singapore'];
  }
}

export default function ProfileSetupPage() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const timezones = useMemo(getTimezones, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name ?? '',
      timezone: user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
    },
  });

  const onSubmit = async (values: UpdateProfileInput) => {
    try {
      await updateProfile.mutateAsync(values);
      navigate(ROUTES.onboardingInstagram);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div>
      <h1 className="text-center text-2xl font-semibold tracking-tight">Set up your profile</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">Tell us a little about you.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Jane Doe" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select value={watch('timezone')} onValueChange={(v) => setValue('timezone', v)}>
            <SelectTrigger id="timezone">
              <SelectValue placeholder="Select timezone" />
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

        <Button type="submit" variant="gradient" className="w-full" loading={updateProfile.isPending}>
          Continue
        </Button>
      </form>
    </div>
  );
}
