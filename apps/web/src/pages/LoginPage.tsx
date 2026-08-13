import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { emailLoginSchema, emailRegisterSchema, type EmailLoginInput, type EmailRegisterInput } from '@instaauto/shared';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useEmailLogin, useEmailRegister } from '@/api/auth';
import { extractErrorMessage } from '@/api/client';
import { ROUTES } from '@/constants/routes';

function EmailLoginForm() {
  const navigate = useNavigate();
  const login = useEmailLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailLoginInput>({ resolver: zodResolver(emailLoginSchema) });

  const onSubmit = async (values: EmailLoginInput) => {
    try {
      await login.mutateAsync(values);
      navigate(ROUTES.onboardingProfile);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-xs space-y-4 text-left">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input id="login-password" type="password" autoComplete="current-password" {...register('password')} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" variant="gradient" className="w-full" loading={login.isPending}>
        Sign in
      </Button>
    </form>
  );
}

function EmailRegisterForm() {
  const navigate = useNavigate();
  const registerAccount = useEmailRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailRegisterInput>({ resolver: zodResolver(emailRegisterSchema) });

  const onSubmit = async (values: EmailRegisterInput) => {
    try {
      await registerAccount.mutateAsync(values);
      navigate(ROUTES.onboardingProfile);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-xs space-y-4 text-left">
      <div className="space-y-2">
        <Label htmlFor="register-name">Name</Label>
        <Input id="register-name" autoComplete="name" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input id="register-email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <Input id="register-password" type="password" autoComplete="new-password" {...register('password')} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" variant="gradient" className="w-full" loading={registerAccount.isPending}>
        Create account
      </Button>
    </form>
  );
}

export default function LoginPage() {
  const [emailMode, setEmailMode] = useState<'login' | 'register'>('login');

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to manage your Instagram automations.</p>

      <Tabs defaultValue="google" className="mt-8 flex w-full flex-col items-center">
        <TabsList>
          <TabsTrigger value="google">Google</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        <TabsContent value="google" className="mt-6 flex justify-center">
          <GoogleSignInButton />
        </TabsContent>

        <TabsContent value="email" className="mt-6 flex w-full flex-col items-center">
          {emailMode === 'login' ? <EmailLoginForm /> : <EmailRegisterForm />}
          <button
            type="button"
            className="mt-4 text-xs text-muted-foreground underline hover:text-foreground"
            onClick={() => setEmailMode((m) => (m === 'login' ? 'register' : 'login'))}
          >
            {emailMode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
          </button>
        </TabsContent>
      </Tabs>

      <p className="mt-8 max-w-xs text-xs text-muted-foreground">
        By continuing you agree to our Terms of Service and Privacy Policy. InstaAuto only automates DMs for
        Instagram Professional accounts, in compliance with Meta&apos;s Platform Terms.
      </p>
    </div>
  );
}
