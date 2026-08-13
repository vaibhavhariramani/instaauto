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
