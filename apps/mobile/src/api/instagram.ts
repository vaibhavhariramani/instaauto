import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { InstagramAccountDto, ReelDto, RecentCommentDto } from '@instaauto/shared';
import { apiClient } from './client';
import { queryKeys } from '@/constants/queryKeys';
import { useActiveUserId } from '@/store/authStore';

// Must match the scheme the backend redirects to for platform=mobile
// (apps/functions/src/controllers/instagram.controller.ts `redirectTarget`).
const OAUTH_REDIRECT_URL = 'instaauto://instagram-connect';

export function useInstagramAccounts() {
  const userId = useActiveUserId();
  return useQuery({
    queryKey: [...queryKeys.instagramAccounts, userId],
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

export function useConnectInstagram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ConnectResponse>('/instagram/connect?platform=mobile');
      return data;
    },
    onSuccess: async (data) => {
      if (data.mode === 'redirect' && data.authUrl) {
        // openAuthSessionAsync (not openBrowserAsync) watches for the redirect back to our own
        // scheme and resolves with that URL directly - the backend redirects here with
        // platform=mobile instead of bouncing to the web app.
        const result = await WebBrowser.openAuthSessionAsync(data.authUrl, OAUTH_REDIRECT_URL);
        if (result.type === 'success') {
          const { queryParams } = Linking.parse(result.url);
          if (queryParams?.connected === 'false') {
            Alert.alert('Instagram connection failed', 'Please try connecting again.');
          }
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.instagramAccounts });
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
  const userId = useActiveUserId();
  return useQuery({
    queryKey: [...queryKeys.reels(accountId ?? ''), userId],
    queryFn: async () => {
      const { data } = await apiClient.get<ReelDto[]>(`/instagram/${accountId}/reels`);
      return data;
    },
    enabled: Boolean(accountId),
    staleTime: 5 * 60_000,
  });
}

export function useRecentComments(accountId: string | undefined) {
  const userId = useActiveUserId();
  return useQuery({
    queryKey: [...queryKeys.recentComments(accountId ?? ''), userId],
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
