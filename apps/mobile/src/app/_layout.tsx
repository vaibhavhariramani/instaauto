import '../styles/global.css';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';

import { queryClient } from '@/api/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { useOnboardingBootstrap, useOnboardingStatus } from '@/hooks/useOnboardingStatus';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  useAuthBootstrap();
  useOnboardingBootstrap();
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { hasOnboarded } = useOnboardingStatus();

  const isReady = !isBootstrapping && hasOnboarded !== null;

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  if (!isReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!accessToken}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!accessToken && !hasOnboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!accessToken && !!hasOnboarded}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <StatusBar style="auto" />
            <RootNavigator />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
