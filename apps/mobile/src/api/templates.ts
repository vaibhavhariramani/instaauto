import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TemplateDto, TemplateInput, UpdateTemplateInput } from '@instaauto/shared';
import { apiClient } from './client';
import { queryKeys } from '@/constants/queryKeys';

export function useTemplates() {
  return useQuery({
    queryKey: queryKeys.templates,
    queryFn: async () => {
      const { data } = await apiClient.get<TemplateDto[]>('/templates');
      return data;
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TemplateInput) => {
      const { data } = await apiClient.post<TemplateDto>('/templates', input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates }),
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTemplateInput }) => {
      const { data } = await apiClient.put<TemplateDto>(`/templates/${id}`, input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates }),
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/templates/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates }),
  });
}

export function useToggleFavoriteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<TemplateDto>(`/templates/${id}/favorite`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates }),
  });
}

export function useDuplicateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<TemplateDto>(`/templates/${id}/duplicate`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates }),
  });
}
