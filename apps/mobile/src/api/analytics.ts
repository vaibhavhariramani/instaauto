import { useQuery } from '@tanstack/react-query';
import type { AnalyticsDto, DashboardStatsDto } from '@instaauto/shared';
import { apiClient } from './client';
import { queryKeys } from '@/constants/queryKeys';
import { useActiveUserId } from '@/store/authStore';

export function useDashboardStats() {
  const userId = useActiveUserId();
  return useQuery({
    queryKey: [...queryKeys.dashboardStats, userId],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardStatsDto>('/analytics/dashboard');
      return data;
    },
    refetchInterval: 30_000,
  });
}

export function useAnalytics(range: 'daily' | 'weekly' | 'monthly') {
  const userId = useActiveUserId();
  return useQuery({
    queryKey: [...queryKeys.analytics({ range }), userId],
    queryFn: async () => {
      const { data } = await apiClient.get<AnalyticsDto>('/analytics', { params: { range } });
      return data;
    },
  });
}
