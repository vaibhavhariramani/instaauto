import { useQuery } from '@tanstack/react-query';
import type { AnalyticsDto, DashboardStatsDto } from '@instaauto/shared';
import { apiClient } from './client';
import { queryKeys } from '@/constants/queryKeys';

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardStatsDto>('/analytics/dashboard');
      return data;
    },
    refetchInterval: 30_000,
  });
}

export function useAnalytics(range: 'daily' | 'weekly' | 'monthly') {
  return useQuery({
    queryKey: queryKeys.analytics({ range }),
    queryFn: async () => {
      const { data } = await apiClient.get<AnalyticsDto>('/analytics', { params: { range } });
      return data;
    },
  });
}
