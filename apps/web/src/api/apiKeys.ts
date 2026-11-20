import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiKeyDto, CreateApiKeyInput, CreatedApiKeyDto } from '@instaauto/shared';
import { apiClient } from './client';
import { queryKeys } from '@/constants/queryKeys';

export function useApiKeys() {
  return useQuery({
    queryKey: queryKeys.apiKeys,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiKeyDto[]>('/api-keys');
      return data;
    },
  });
}

// The create response carries the one-time secret. It is returned to the caller only - never
// written into the query cache - so it exists nowhere but the component state that holds it.
export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateApiKeyInput) => {
      const { data } = await apiClient.post<CreatedApiKeyDto>('/api-keys', input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys }),
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api-keys/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys }),
  });
}
