import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SimulateCommentInput } from '@instaauto/shared';
import { apiClient } from './client';

/** Fires a synthetic comment through the real automation pipeline (mock mode only). */
export function useSimulateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SimulateCommentInput) => {
      await apiClient.post('/dev/simulate-comment', input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });
}
