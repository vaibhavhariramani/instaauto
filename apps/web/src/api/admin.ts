import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminDashboardDto,
  AdminUpdateUserPlanInput,
  AdminUserDetailDto,
  AdminUserListResponseDto,
  SubscriptionPlan,
} from '@instaauto/shared';
import { apiClient } from './client';
import { queryKeys } from '@/constants/queryKeys';

export function useAdminDashboard() {
  return useQuery({
    queryKey: queryKeys.adminDashboard,
    queryFn: async () => {
      const { data } = await apiClient.get<AdminDashboardDto>('/admin/dashboard');
      return data;
    },
  });
}

export interface AdminUsersParams {
  page: number;
  pageSize: number;
  search?: string;
  plan?: SubscriptionPlan;
}

export function useAdminUsers(params: AdminUsersParams) {
  return useQuery({
    queryKey: queryKeys.adminUsers(params),
    queryFn: async () => {
      const { data } = await apiClient.get<AdminUserListResponseDto>('/admin/users', {
        params,
      });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.adminUser(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<AdminUserDetailDto>(`/admin/users/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useAdminUpdateUserPlan(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdminUpdateUserPlanInput) => {
      const { data } = await apiClient.patch(`/admin/users/${id}/plan`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUser(id) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
    },
  });
}
