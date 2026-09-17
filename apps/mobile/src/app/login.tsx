import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthForm } from '@/components/auth/AuthForm';

export default function LoginScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-1 justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-10 items-center gap-3">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand-500">
              <Text className="text-2xl font-bold text-white">IA</Text>
            </View>
            <View className="items-center gap-1">
              <Text className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                Welcome to InstaAuto
              </Text>
              <Text className="text-center text-[15px] leading-5 text-neutral-500 dark:text-neutral-400">
                Automate Instagram DM replies to comments
              </Text>
            </View>
          </View>

          <AuthForm />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
