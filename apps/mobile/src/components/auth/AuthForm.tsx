import { useState } from 'react';
import { Text, View } from 'react-native';
import { emailLoginSchema, emailRegisterSchema } from '@instaauto/shared';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { useEmailLogin, useEmailRegister } from '@/api/auth';
import { extractErrorMessage } from '@/api/client';

type Mode = 'login' | 'register';

function flattenZodErrors(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** Email/password + Google sign-in form, shared by the initial login screen and "add account". */
export function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const login = useEmailLogin();
  const register = useEmailRegister();
  const pending = login.isPending || register.isPending;

  const onSubmit = async () => {
    setFormError(null);
    setFieldErrors({});

    if (mode === 'login') {
      const parsed = emailLoginSchema.safeParse({ email, password });
      if (!parsed.success) {
        setFieldErrors(flattenZodErrors(parsed.error));
        return;
      }
      try {
        await login.mutateAsync(parsed.data);
        onSuccess?.();
      } catch (err) {
        setFormError(extractErrorMessage(err));
      }
    } else {
      const parsed = emailRegisterSchema.safeParse({ name, email, password });
      if (!parsed.success) {
        setFieldErrors(flattenZodErrors(parsed.error));
        return;
      }
      try {
        await register.mutateAsync(parsed.data);
        onSuccess?.();
      } catch (err) {
        setFormError(extractErrorMessage(err));
      }
    }
  };

  return (
    <View className="gap-4">
      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={[
          { value: 'login', label: 'Sign in' },
          { value: 'register', label: 'Create account' },
        ]}
      />

      {mode === 'register' && (
        <TextField
          label="Name"
          autoComplete="name"
          value={name}
          onChangeText={setName}
          error={fieldErrors.name}
        />
      )}
      <TextField
        label="Email"
        autoComplete="email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
      />
      <TextField
        label="Password"
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
      />

      {formError && <Text className="text-sm text-red-600 dark:text-red-400">{formError}</Text>}

      <Button
        label={mode === 'login' ? 'Sign in' : 'Create account'}
        onPress={onSubmit}
        loading={pending}
        className="mt-1"
      />

      <View className="flex-row items-center gap-3 py-1">
        <View className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        <Text className="text-xs text-neutral-400 dark:text-neutral-500">or continue with</Text>
        <View className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </View>

      <GoogleSignInButton onSuccess={onSuccess} />
    </View>
  );
}
