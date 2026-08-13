import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationDto, PaginatedResult } from '@instaauto/shared';
import { apiClient } from './client';
import { queryKeys } from '@/constants/queryKeys';
import { useAuthStore } from '@/store/authStore';

interface NotificationsResponse extends PaginatedResult<NotificationDto> {
  unreadCount: number;
}

export function useNotifications(page = 1) {
  const isAuthed = Boolean(useAuthStore((s) => s.accessToken));
  return useQuery({
    queryKey: queryKeys.notifications(page),
    queryFn: async () => {
      const { data } = await apiClient.get<NotificationsResponse>('/notifications', { params: { page } });
      return data;
    },
    enabled: isAuthed,
    refetchInterval: 15_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/notifications/${id}/read`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/notifications/read-all');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
