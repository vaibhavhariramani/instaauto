import { create } from 'zustand';
import type { UserDto } from '@instaauto/shared';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  isBootstrapping: boolean;
  setAuth: (accessToken: string, user: UserDto) => void;
  setUser: (user: UserDto) => void;
  clear: () => void;
  setBootstrapping: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isBootstrapping: true,
  setAuth: (accessToken, user) => set({ accessToken, user, isBootstrapping: false }),
  setUser: (user) => set({ user }),
  clear: () => set({ accessToken: null, user: null, isBootstrapping: false }),
  setBootstrapping: (v) => set({ isBootstrapping: v }),
}));

/**
 * The current user's id, for scoping React Query cache keys. Without this, a
 * response for the previous account that's still in flight when the user
 * switches accounts can land late and overwrite the new account's cache entry
 * (both used the same key) - keying every query by user id means it writes to
 * its own slot instead, no matter when it resolves.
 */
export function useActiveUserId(): string {
  return useAuthStore((s) => s.user?.id) ?? 'anonymous';
}
