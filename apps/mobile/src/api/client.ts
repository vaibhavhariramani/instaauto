import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useAccountsStore } from '@/store/accountsStore';
import type { ApiErrorBody, AuthTokensDto } from '@instaauto/shared';

// No same-origin relative path on native, unlike the web app - default to
// the deployed production API so the app works out of the box; override
// with EXPO_PUBLIC_API_URL for local dev against the Functions emulator.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://instaautomation-1da00.web.app/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { accounts, activeUserId, upsertAccount } = useAccountsStore.getState();
  const active = accounts.find((a) => a.userId === activeUserId);

  try {
    const { data } = await axios.post<AuthTokensDto>(
      `${API_BASE_URL}/auth/refresh`,
      active ? { refreshToken: active.refreshToken } : {},
      { withCredentials: true },
    );
    upsertAccount({
      userId: data.user.id,
      email: data.user.email,
      name: data.user.name,
      avatarUrl: data.user.avatarUrl,
      refreshToken: data.refreshToken,
    });
    useAuthStore.getState().setAuth(data.accessToken, data.user);
    return data.accessToken;
  } catch {
    if (active) useAccountsStore.getState().removeAccount(active.userId);
    useAuthStore.getState().clear();
    return null;
  }
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetriableConfig | undefined;
    const isAuthRoute = original?.url?.includes('/auth/');

    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
    }

    return Promise.reject(error);
  },
);

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    return body?.error?.message ?? error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong';
}
