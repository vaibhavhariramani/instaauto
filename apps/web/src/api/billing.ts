import { useMutation, useQuery } from '@tanstack/react-query';
import type { SubscriptionPlan } from '@instaauto/shared';
import { apiClient } from './client';
import { queryKeys } from '@/constants/queryKeys';

interface Invoice {
  id: string;
  number: string | null;
  amountPaid: number;
  currency: string;
  status: string | null;
  createdAt: string;
  hostedInvoiceUrl: string | null;
}

export function useInvoices() {
  return useQuery({
    queryKey: queryKeys.billingInvoices,
    queryFn: async () => {
      const { data } = await apiClient.get<Invoice[]>('/billing/invoices');
      return data;
    },
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async (input: { plan: SubscriptionPlan; billingCycle: 'monthly' | 'yearly' }) => {
      const { data } = await apiClient.post<{ url: string }>('/billing/checkout', input);
      return data;
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
}

export function useCreatePortalSession() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ url: string }>('/billing/portal');
      return data;
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
}
