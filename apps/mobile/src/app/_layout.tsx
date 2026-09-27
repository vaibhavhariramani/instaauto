import '../styles/global.css';
import { useEffect, useMemo, useState } from 'react';
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

  // Belt-and-suspenders: isReady depends on two independent SecureStore/AsyncStorage
  // rehydrations (auth bootstrap, onboarding status). Each already has its own error
  // handling, but this app has no error UI for "not ready" - it just renders null - so a
  // hang in either one (a storage read that neither resolves nor rejects, a future
  // regression, etc.) would otherwise leave the user on an indefinite blank screen with no
  // way out. Force progress after a few seconds no matter what.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (isReady) return;
    const timer = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, [isReady]);

  const shouldRender = isReady || timedOut;

  useEffect(() => {
    if (shouldRender) SplashScreen.hideAsync();
  }, [shouldRender]);

  if (!shouldRender) return null;

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
