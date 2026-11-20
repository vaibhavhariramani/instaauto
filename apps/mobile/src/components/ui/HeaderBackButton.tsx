import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useRootNavigationState } from 'expo-router';

/**
 * A tab's root screen (Dashboard, Analytics, Messages, Automations, Settings) never gets a
 * back button from its own navigator - switching tabs isn't a "push," and neither is landing
 * on a tab's root via a deep link (dashboard card -> Messages tab, Settings -> Reels, etc).
 * router.canGoBack() reflects that history app-wide, so this renders itself only when there's
 * actually somewhere to return to. useRootNavigationState() re-renders on every navigation
 * action anywhere in the tree (its object identity changes bottom-up), which is what keeps
 * canGoBack() fresh here even though the value it returns isn't used directly.
 */
export function HeaderBackButton() {
  useRootNavigationState();
  if (!router.canGoBack()) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={() => router.back()}
      hitSlop={12}
      className="-ml-2 p-2"
    >
      <Ionicons name="chevron-back" size={26} color="#5e6ad2" />
    </Pressable>
  );
}
