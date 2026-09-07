import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { useOnboardingStore } from '@/store/onboardingStore';

const ONBOARDING_KEY = 'instaauto_onboarding_complete';

// expo-secure-store wraps the Keychain/Keystore and has no web implementation -
// fall back to localStorage there so the web build (see app.config.ts `web` target)
// doesn't crash on every route.
function getStored(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return Promise.resolve(window.localStorage.getItem(ONBOARDING_KEY));
    } catch {
      return Promise.resolve(null);
    }
  }
  return SecureStore.getItemAsync(ONBOARDING_KEY);
}

function setStored(value: string) {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.setItem(ONBOARDING_KEY, value);
    } catch {
      /* private-browsing or storage disabled - onboarding just replays next visit */
    }
    return;
  }
  SecureStore.setItemAsync(ONBOARDING_KEY, value);
}

/** Reads the persisted onboarding flag once into the shared store - call this at the app root. */
export function useOnboardingBootstrap() {
  const setHasOnboarded = useOnboardingStore((s) => s.setHasOnboarded);

  useEffect(() => {
    let cancelled = false;
    getStored().then((value) => {
      if (!cancelled) setHasOnboarded(value === 'true');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Reads the current onboarding status and exposes a way to mark it complete. */
export function useOnboardingStatus() {
  const hasOnboarded = useOnboardingStore((s) => s.hasOnboarded);
  const setHasOnboarded = useOnboardingStore((s) => s.setHasOnboarded);

  const completeOnboarding = () => {
    setHasOnboarded(true);
    setStored('true');
  };

  return { hasOnboarded, completeOnboarding };
}
