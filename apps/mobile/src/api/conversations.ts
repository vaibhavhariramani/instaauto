import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConversationDto, DirectMessageDto } from '@instaauto/shared';
import { apiClient } from './client';
import { queryKeys } from '@/constants/queryKeys';
import { useActiveUserId } from '@/store/authStore';

export function useConversations(accountId: string | undefined) {
  const userId = useActiveUserId();
  return useQuery({
    queryKey: [...queryKeys.conversations(accountId ?? ''), userId],
    queryFn: async () => {
      const { data } = await apiClient.get<ConversationDto[]>(`/conversations/${accountId}`);
      return data;
    },
    enabled: Boolean(accountId),
    refetchInterval: 30_000,
  });
}

interface ConversationThread {
  conversation: ConversationDto;
  messages: DirectMessageDto[];
}

export function useConversationMessages(
  accountId: string | undefined,
  conversationId: string | undefined,
) {
  const userId = useActiveUserId();
  return useQuery({
    queryKey: [...queryKeys.conversationMessages(accountId ?? '', conversationId ?? ''), userId],
    queryFn: async () => {
      const { data } = await apiClient.get<ConversationThread>(
        `/conversations/${accountId}/${conversationId}`,
      );
      return data;
    },
    enabled: Boolean(accountId) && Boolean(conversationId),
    refetchInterval: 15_000,
  });
}

export function useSendMessage(accountId: string | undefined, conversationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await apiClient.post<DirectMessageDto>(
        `/conversations/${accountId}/${conversationId}/messages`,
        { content },
      );
      return data;
    },
    onSuccess: () => {
      if (!accountId || !conversationId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversationMessages(accountId, conversationId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations(accountId) });
    },
  });
}
