import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationPrefsInput, UpdateProfileInput, UserDto } from '@instaauto/shared';
import { apiClient } from './client';
import { queryKeys } from '@/constants/queryKeys';
import { useAuthStore, useActiveUserId } from '@/store/authStore';
import { useAccountsStore } from '@/store/accountsStore';

export function useMe(enabled: boolean) {
  const setUser = useAuthStore((s) => s.setUser);
  const userId = useActiveUserId();
  return useQuery({
    queryKey: [...queryKeys.me, userId],
    queryFn: async () => {
      const { data } = await apiClient.get<UserDto>('/me');
      // A response for an account that's since been switched away from can land
      // late - only apply it if it still matches whoever is active right now.
      if (useAuthStore.getState().user?.id === data.id) setUser(data);
      return data;
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const { data } = await apiClient.patch<UserDto>('/me', input);
      return data;
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.setQueryData([...queryKeys.me, data.id], data);
    },
  });
}

export function useCompleteOnboarding() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<UserDto>('/me/complete-onboarding');
      return data;
    },
    onSuccess: (data) => setUser(data),
  });
}

export function useUpdateNotificationPrefs() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (input: NotificationPrefsInput) => {
      const { data } = await apiClient.patch<UserDto>('/me/notifications-prefs', input);
      return data;
    },
    onSuccess: (data) => setUser(data),
  });
}

export function useRegisterPushToken() {
  return useMutation({
    mutationFn: async (token: string) => {
      await apiClient.post('/me/push-token', { token });
    },
  });
}

export function useDeleteAccount() {
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete('/me');
    },
    onSuccess: () => {
      const { activeUserId, removeAccount } = useAccountsStore.getState();
      if (activeUserId) removeAccount(activeUserId);
      queryClient.clear();
      clear();
    },
  });
}
