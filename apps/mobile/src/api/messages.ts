import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageDto, PaginatedResult } from '@instaauto/shared';
import { apiClient } from './client';
import { queryKeys } from '@/constants/queryKeys';

export interface MessagesFilters {
  page: number;
  pageSize: number;
  status: 'ALL' | 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'RETRYING';
  search?: string;
}

export function useMessages(filters: MessagesFilters) {
  return useQuery({
    queryKey: queryKeys.messages(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResult<MessageDto>>('/messages', {
        params: filters,
      });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useRetryMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/messages/${id}/retry`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
  });
}
