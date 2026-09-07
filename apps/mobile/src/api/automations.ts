import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AutomationDto, AutomationInput, UpdateAutomationInput } from '@instaauto/shared';
import { apiClient } from './client';
import { queryKeys } from '@/constants/queryKeys';

export function useAutomations() {
  return useQuery({
    queryKey: queryKeys.automations,
    queryFn: async () => {
      const { data } = await apiClient.get<AutomationDto[]>('/automation');
      return data;
    },
  });
}

export function useAutomation(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.automation(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<AutomationDto>(`/automation/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AutomationInput) => {
      const { data } = await apiClient.post<AutomationDto>('/automation', input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.automations }),
  });
}

export function useUpdateAutomation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateAutomationInput) => {
      const { data } = await apiClient.put<AutomationDto>(`/automation/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.automations });
      queryClient.invalidateQueries({ queryKey: queryKeys.automation(id) });
    },
  });
}

export function useDeleteAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/automation/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.automations }),
  });
}
