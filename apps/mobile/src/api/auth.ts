import { useMutation } from '@tanstack/react-query';
import type {
  AuthTokensDto,
  EmailLoginInput,
  EmailRegisterInput,
  UserDto,
} from '@instaauto/shared';
import { apiClient } from './client';
import { queryClient } from './queryClient';
import { useAuthStore } from '@/store/authStore';
import { useAccountsStore, type SavedAccount } from '@/store/accountsStore';

function toSavedAccount(user: UserDto, refreshToken: string): SavedAccount {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    refreshToken,
  };
}

/** Records a successful login/refresh in both the active session and the saved-accounts list. */
function adoptSession(data: AuthTokensDto) {
  useAccountsStore.getState().upsertAccount(toSavedAccount(data.user, data.refreshToken));
  useAccountsStore.getState().setActiveUserId(data.user.id);
  useAuthStore.getState().setAuth(data.accessToken, data.user);
}

export function useGoogleLogin() {
  return useMutation({
    mutationFn: async (idToken: string) => {
      const { data } = await apiClient.post<AuthTokensDto>('/auth/google', { idToken });
      return data;
    },
    onSuccess: adoptSession,
  });
}

export function useEmailLogin() {
  return useMutation({
    mutationFn: async (input: EmailLoginInput) => {
      const { data } = await apiClient.post<AuthTokensDto>('/auth/login', input);
      return data;
    },
    onSuccess: adoptSession,
  });
}

export function useEmailRegister() {
  return useMutation({
    mutationFn: async (input: EmailRegisterInput) => {
      const { data } = await apiClient.post<AuthTokensDto>('/auth/register', input);
      return data;
    },
    onSuccess: adoptSession,
  });
}

/** Switches the active session to an already-saved account, refreshing its token first. */
export function useSwitchAccount() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const account = useAccountsStore.getState().accounts.find((a) => a.userId === userId);
      if (!account) throw new Error('That account is no longer saved on this device.');
      const { data } = await apiClient.post<AuthTokensDto>('/auth/refresh', {
        refreshToken: account.refreshToken,
      });
      return data;
    },
    onSuccess: (data) => {
      // The previous account's cached automations/dashboard/etc. don't belong to this user.
      queryClient.clear();
      adoptSession(data);
    },
    onError: (_err, userId) => {
      // The saved refresh token was rejected (revoked/expired elsewhere) - drop the dead entry.
      useAccountsStore.getState().removeAccount(userId);
    },
  });
}

/** Signs out of the current account entirely - revokes it server-side and forgets it here. */
export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const { activeUserId, accounts } = useAccountsStore.getState();
      const active = accounts.find((a) => a.userId === activeUserId);
      await apiClient.post('/auth/logout', active ? { refreshToken: active.refreshToken } : {});
    },
    onSuccess: () => {
      const { activeUserId, removeAccount } = useAccountsStore.getState();
      if (activeUserId) removeAccount(activeUserId);
      queryClient.clear();
      useAuthStore.getState().clear();
    },
  });
}

/** Removes a saved (not necessarily active) account from this device, revoking it server-side. */
export function useRemoveAccount() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const account = useAccountsStore.getState().accounts.find((a) => a.userId === userId);
      if (account) await apiClient.post('/auth/logout', { refreshToken: account.refreshToken });
      return userId;
    },
    onSuccess: (userId) => {
      const wasActive = useAccountsStore.getState().activeUserId === userId;
      useAccountsStore.getState().removeAccount(userId);
      if (wasActive) {
        queryClient.clear();
        useAuthStore.getState().clear();
      }
    },
  });
}
