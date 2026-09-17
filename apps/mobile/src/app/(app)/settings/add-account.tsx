import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AuthForm } from '@/components/auth/AuthForm';

export default function AddAccountScreen() {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-neutral-50 dark:bg-neutral-950"
        contentContainerClassName="gap-4 p-4 pt-2"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-2 gap-1">
          <Text className="text-[15px] text-neutral-500 dark:text-neutral-400">
            Sign in with another email or Google account - it's saved alongside your current one so
            you can switch back anytime.
          </Text>
        </View>

        <AuthForm onSuccess={() => router.dismissTo('/settings')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
