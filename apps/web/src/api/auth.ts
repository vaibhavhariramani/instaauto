import { useMutation } from '@tanstack/react-query';
import type { AuthTokensDto, EmailLoginInput, EmailRegisterInput } from '@instaauto/shared';
import { apiClient } from './client';
import { useAuthStore } from '@/store/authStore';

export function useGoogleLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (idToken: string) => {
      const { data } = await apiClient.post<AuthTokensDto>('/auth/google', { idToken });
      return data;
    },
    onSuccess: (data) => setAuth(data.accessToken, data.user),
  });
}

export function useEmailLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (input: EmailLoginInput) => {
      const { data } = await apiClient.post<AuthTokensDto>('/auth/login', input);
      return data;
    },
    onSuccess: (data) => setAuth(data.accessToken, data.user),
  });
}

export function useEmailRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (input: EmailRegisterInput) => {
      const { data } = await apiClient.post<AuthTokensDto>('/auth/register', input);
      return data;
    },
    onSuccess: (data) => setAuth(data.accessToken, data.user),
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => clear(),
  });
}
