import { Appearance } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  isDarkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

// Appearance.setColorScheme overrides what every useColorScheme() call (both plain
// react-native and NativeWind's dark: variants, which read from the same Appearance
// module) reports app-wide, independent of the OS setting - this is what makes a single
// toggle affect the whole app's theming with no per-screen wiring needed.
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: Appearance.getColorScheme() === 'dark',
      setDarkMode: (value) => {
        Appearance.setColorScheme(value ? 'dark' : 'light');
        set({ isDarkMode: value });
      },
    }),
    {
      name: 'instaauto-theme',
      storage: createJSONStorage(() => AsyncStorage),
      // Appearance.setColorScheme's override resets on every cold start, so the persisted
      // preference has to be reapplied as soon as it's read back, or the app would silently
      // fall back to the system scheme until the next toggle.
      onRehydrateStorage: () => (state) => {
        if (state) Appearance.setColorScheme(state.isDarkMode ? 'dark' : 'light');
      },
    },
  ),
);
