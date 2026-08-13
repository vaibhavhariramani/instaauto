import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationPrefsInput, UpdateProfileInput, UserDto } from '@instaauto/shared';
import { apiClient } from './client';
import { queryKeys } from '@/constants/queryKeys';
import { useAuthStore } from '@/store/authStore';

export function useMe(enabled: boolean) {
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const { data } = await apiClient.get<UserDto>('/me');
      setUser(data);
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
      queryClient.setQueryData(queryKeys.me, data);
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

export function useDeleteAccount() {
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete('/me');
    },
    onSuccess: () => clear(),
  });
}
