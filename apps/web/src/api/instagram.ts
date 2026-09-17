import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InstagramAccountDto, ReelDto, RecentCommentDto } from '@instaauto/shared';
import { apiClient } from './client';
import { queryKeys } from '@/constants/queryKeys';

export function useInstagramAccounts() {
  return useQuery({
    queryKey: queryKeys.instagramAccounts,
    queryFn: async () => {
      const { data } = await apiClient.get<InstagramAccountDto[]>('/instagram');
      return data;
    },
  });
}

interface ConnectResponse {
  mode: 'mock' | 'redirect';
  account?: InstagramAccountDto;
  authUrl?: string;
}

export function useConnectInstagram(returnTo: 'onboarding' | 'settings' = 'onboarding') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ConnectResponse>(
        `/instagram/connect?returnTo=${returnTo}`,
      );
      return data;
    },
    onSuccess: (data) => {
      if (data.mode === 'redirect' && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.instagramAccounts });
      }
    },
  });
}

export function useDisconnectInstagram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      await apiClient.post(`/instagram/${accountId}/disconnect`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.instagramAccounts }),
  });
}

export function useReels(accountId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reels(accountId ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<ReelDto[]>(`/instagram/${accountId}/reels`);
      return data;
    },
    enabled: Boolean(accountId),
    staleTime: 5 * 60_000,
  });
}

export function useRecentComments(accountId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.recentComments(accountId ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<RecentCommentDto[]>(`/instagram/${accountId}/comments`);
      return data;
    },
    enabled: Boolean(accountId),
  });
}

export function useReplyToComment(accountId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, message }: { commentId: string; message: string }) => {
      const { data } = await apiClient.post(`/instagram/${accountId}/comments/${commentId}/reply`, {
        message,
      });
      return data;
    },
    onSuccess: () => {
      if (accountId)
        queryClient.invalidateQueries({ queryKey: queryKeys.recentComments(accountId) });
    },
  });
}
