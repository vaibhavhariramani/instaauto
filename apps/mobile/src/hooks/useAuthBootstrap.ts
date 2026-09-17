import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useAccountsStore, useAccountsHydrated } from '@/store/accountsStore';
import { API_BASE_URL } from '@/api/client';
import type { AuthTokensDto } from '@instaauto/shared';

/**
 * Restores a session on launch: uses the active saved account's refresh token if one
 * exists (multi-account switching means there's no single shared cookie session to
 * rely on), falling back to the httpOnly cookie for installs from before accounts were
 * tracked locally.
 */
export function useAuthBootstrap() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping);
  const accountsHydrated = useAccountsHydrated();

  useEffect(() => {
    if (!accountsHydrated) return;
    let cancelled = false;

    async function bootstrap() {
      const { accounts, activeUserId, upsertAccount, setActiveUserId } =
        useAccountsStore.getState();
      const active = accounts.find((a) => a.userId === activeUserId) ?? accounts[0];

      try {
        const { data } = await axios.post<AuthTokensDto>(
          `${API_BASE_URL}/auth/refresh`,
          active ? { refreshToken: active.refreshToken } : {},
          { withCredentials: true },
        );
        if (cancelled) return;
        upsertAccount({
          userId: data.user.id,
          email: data.user.email,
          name: data.user.name,
          avatarUrl: data.user.avatarUrl,
          refreshToken: data.refreshToken,
        });
        setActiveUserId(data.user.id);
        setAuth(data.accessToken, data.user);
      } catch {
        if (!cancelled) setBootstrapping(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountsHydrated]);
}
