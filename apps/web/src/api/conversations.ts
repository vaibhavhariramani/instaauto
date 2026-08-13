import { useQuery } from '@tanstack/react-query';
import type { ConversationDto, DirectMessageDto } from '@instaauto/shared';
import { apiClient } from './client';
import { queryKeys } from '@/constants/queryKeys';

export function useConversations(accountId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.conversations(accountId ?? ''),
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

export function useConversationMessages(accountId: string | undefined, conversationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.conversationMessages(accountId ?? '', conversationId ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<ConversationThread>(`/conversations/${accountId}/${conversationId}`);
      return data;
    },
    enabled: Boolean(accountId) && Boolean(conversationId),
    refetchInterval: 15_000,
  });
}
