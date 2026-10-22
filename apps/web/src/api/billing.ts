import { useMutation, useQuery } from '@tanstack/react-query';
import type { CreateCheckoutSessionInput } from '@instaauto/shared';
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
    // Typed from the same Zod schema the backend validates against (plan excludes STARTER - the
    // free plan has no checkout, see createCheckoutSessionSchema) so a misuse like "checkout into
    // Free" is a compile error here, not just a 400 from the server.
    mutationFn: async (input: CreateCheckoutSessionInput) => {
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
