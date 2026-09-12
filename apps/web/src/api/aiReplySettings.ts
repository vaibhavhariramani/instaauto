import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AiReplySettingsDto, AiReplySettingsInput } from '@instaauto/shared';
import { apiClient } from './client';
import { queryKeys } from '@/constants/queryKeys';

export function useAiReplySettings(accountId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.aiReplySettings(accountId ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<AiReplySettingsDto>(
        `/instagram/${accountId}/ai-settings`,
      );
      return data;
    },
    enabled: Boolean(accountId),
  });
}

export function useUpdateAiReplySettings(accountId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AiReplySettingsInput) => {
      const { data } = await apiClient.patch<AiReplySettingsDto>(
        `/instagram/${accountId}/ai-settings`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      if (accountId)
        queryClient.invalidateQueries({ queryKey: queryKeys.aiReplySettings(accountId) });
    },
  });
}
