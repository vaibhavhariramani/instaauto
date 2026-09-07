import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from '@/api/client';
import type { AuthTokensDto } from '@instaauto/shared';

/** Attempts to silently restore a session from the httpOnly refresh cookie on first load. */
export function useAuthBootstrap() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        const { data } = await axios.post<AuthTokensDto>(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        if (!cancelled) setAuth(data.accessToken, data.user);
      } catch {
        if (!cancelled) setBootstrapping(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
