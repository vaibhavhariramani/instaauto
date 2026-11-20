import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system';

interface UiState {
  theme: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  notificationDrawerOpen: boolean;
  setTheme: (theme: ThemePreference) => void;
  toggleSidebar: () => void;
  setNotificationDrawerOpen: (open: boolean) => void;
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(theme: ThemePreference): 'light' | 'dark' {
  return theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme;
}

function applyDomTheme(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: resolve('system'),
      sidebarCollapsed: false,
      notificationDrawerOpen: false,
      setTheme: (theme) => {
        const resolvedTheme = resolve(theme);
        applyDomTheme(resolvedTheme);
        set({ theme, resolvedTheme });
      },
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setNotificationDrawerOpen: (open) => set({ notificationDrawerOpen: open }),
    }),
    {
      name: 'instaauto-ui',
      partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolvedTheme = resolve(state.theme);
          applyDomTheme(resolvedTheme);
          state.resolvedTheme = resolvedTheme;
        }
      },
    },
  ),
);

if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme, setTheme } = useUiStore.getState();
    if (theme === 'system') setTheme('system');
  });
}
