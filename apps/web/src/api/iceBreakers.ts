import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IceBreakerDto, IceBreakerInput, UpdateIceBreakerInput } from '@instaauto/shared';
import { apiClient } from './client';
import { queryKeys } from '@/constants/queryKeys';

export function useIceBreakers(accountId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.iceBreakers(accountId ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<IceBreakerDto[]>(`/ice-breakers/${accountId}`);
      return data;
    },
    enabled: Boolean(accountId),
  });
}

export function useCreateIceBreaker(accountId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: IceBreakerInput) => {
      const { data } = await apiClient.post<IceBreakerDto>('/ice-breakers', input);
      return data;
    },
    onSuccess: () => {
      if (accountId) queryClient.invalidateQueries({ queryKey: queryKeys.iceBreakers(accountId) });
    },
  });
}

export function useUpdateIceBreaker(accountId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateIceBreakerInput }) => {
      const { data } = await apiClient.put<IceBreakerDto>(`/ice-breakers/${id}`, input);
      return data;
    },
    onSuccess: () => {
      if (accountId) queryClient.invalidateQueries({ queryKey: queryKeys.iceBreakers(accountId) });
    },
  });
}

export function useDeleteIceBreaker(accountId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/ice-breakers/${id}`);
    },
    onSuccess: () => {
      if (accountId) queryClient.invalidateQueries({ queryKey: queryKeys.iceBreakers(accountId) });
    },
  });
}
