export const queryKeys = {
  me: ['me'] as const,
  instagramAccounts: ['instagram', 'accounts'] as const,
  reels: (accountId: string) => ['instagram', 'reels', accountId] as const,
  recentComments: (accountId: string) => ['instagram', 'comments', accountId] as const,
  conversations: (accountId: string) => ['conversations', accountId] as const,
  conversationMessages: (accountId: string, conversationId: string) =>
    ['conversations', accountId, conversationId] as const,
  automations: ['automations'] as const,
  automation: (id: string) => ['automations', id] as const,
  templates: ['templates'] as const,
  messages: (params: unknown) => ['messages', params] as const,
  dashboardStats: ['analytics', 'dashboard'] as const,
  analytics: (params: unknown) => ['analytics', params] as const,
  notifications: (page: number) => ['notifications', page] as const,
  billingPlans: ['billing', 'plans'] as const,
  billingInvoices: ['billing', 'invoices'] as const,
};
