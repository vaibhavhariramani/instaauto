import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

export interface SavedAccount {
  userId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  /** Rotates on every refresh - always the latest value the backend issued. */
  refreshToken: string;
}

interface AccountsState {
  accounts: SavedAccount[];
  activeUserId: string | null;
  upsertAccount: (account: SavedAccount) => void;
  removeAccount: (userId: string) => void;
  setActiveUserId: (userId: string | null) => void;
}

// Refresh tokens are long-lived credentials - Keychain-backed SecureStore, not
// plain AsyncStorage, even though this store also just holds "which accounts
// are saved" bookkeeping.
const secureJSONStorage = createJSONStorage(() => ({
  getItem: async (name: string) => (await SecureStore.getItemAsync(name)) ?? null,
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
}));

export const useAccountsStore = create<AccountsState>()(
  persist(
    (set) => ({
      accounts: [],
      activeUserId: null,
      upsertAccount: (account) =>
        set((s) => ({
          accounts: [...s.accounts.filter((a) => a.userId !== account.userId), account],
        })),
      removeAccount: (userId) =>
        set((s) => ({
          accounts: s.accounts.filter((a) => a.userId !== userId),
          activeUserId: s.activeUserId === userId ? null : s.activeUserId,
        })),
      setActiveUserId: (userId) => set({ activeUserId: userId }),
    }),
    {
      name: 'instaauto-accounts',
      storage: secureJSONStorage,
    },
  ),
);

/** True once the accounts list has been read back from SecureStore. */
export function useAccountsHydrated() {
  const [hydrated, setHydrated] = useState(useAccountsStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    return useAccountsStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);
  return hydrated;
}
