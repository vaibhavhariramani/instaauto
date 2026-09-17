import '../styles/global.css';
import { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

import { queryClient } from '@/api/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useAccountsStore } from '@/store/accountsStore';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { useOnboardingBootstrap, useOnboardingStatus } from '@/hooks/useOnboardingStatus';

SplashScreen.preventAutoHideAsync();

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'instaauto-query-cache',
});

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
  // Rehydrating another account's persisted cache under a new active user would
  // briefly flash their data - bust the persisted cache whenever the active
  // account changes so a switch always starts from a clean slate.
  const activeUserId = useAccountsStore((s) => s.activeUserId);
  const persistOptions = useMemo(
    () => ({ persister: asyncStoragePersister, buster: activeUserId ?? 'anonymous' }),
    [activeUserId],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <StatusBar style="auto" />
            <RootNavigator />
          </ThemeProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
