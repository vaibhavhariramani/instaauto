import type {
  AdminActionLog,
  AnalyticsDaily,
  Automation,
  InstagramAccount,
  User,
} from '@prisma/client';
import type {
  AdminDashboardDto,
  AdminUserDetailDto,
  AdminUserListItemDto,
} from '@instaauto/shared';
import type { listInvoices } from '../services/stripeService';

type ListUserRow = Pick<
  User,
  'id' | 'email' | 'name' | 'createdAt' | 'isAdmin' | 'subscriptionPlan' | 'subscriptionStatus'
>;

export function toAdminUserListItemDto(
  user: ListUserRow,
  counts: {
    connectedAccountsCount: number;
    activeAutomationsCount: number;
    dmsSentThisPeriod: number;
  },
): AdminUserListItemDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
    isAdmin: user.isAdmin,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionStatus: user.subscriptionStatus,
    connectedAccountsCount: counts.connectedAccountsCount,
    activeAutomationsCount: counts.activeAutomationsCount,
    dmsSentThisPeriod: counts.dmsSentThisPeriod,
  };
}

interface UserDetailExtras {
  connectedAccounts: InstagramAccount[];
  automations: Automation[];
  dmsSentThisPeriod: number;
  dmLimitPerMonth: number;
  usageHistory: AnalyticsDaily[];
  recentInvoices: Awaited<ReturnType<typeof listInvoices>>;
  recentAuditEvents: { action: string; createdAt: Date }[];
  recentAdminActions: (AdminActionLog & { actor: { email: string } })[];
}

// Deliberately narrow — never spread the raw User/InstagramAccount row here. No
// accessTokenEncrypted, no passwordHash, no stripeCustomerId value (only whether one exists), no
// googleId/appleId. Add fields one at a time, on purpose, not by widening this shape.
export function toAdminUserDetailDto(user: User, extras: UserDetailExtras): AdminUserDetailDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    isAdmin: user.isAdmin,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionCurrentPeriodStart: user.subscriptionCurrentPeriodStart?.toISOString() ?? null,
    subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd?.toISOString() ?? null,
    hasStripeCustomer: Boolean(user.stripeCustomerId),
    connectedAccounts: extras.connectedAccounts.map((a) => ({
      id: a.id,
      username: a.username,
      status: a.status,
      connectedAt: a.connectedAt.toISOString(),
      followersCount: a.followersCount,
    })),
    automations: extras.automations.map((a) => ({
      id: a.id,
      name: a.name,
      isActive: a.isActive,
      totalTriggers: a.totalTriggers,
      totalDMsSent: a.totalDMsSent,
    })),
    dmsSentThisPeriod: extras.dmsSentThisPeriod,
    dmLimitPerMonth: extras.dmLimitPerMonth,
    usageHistory: extras.usageHistory.map((d) => ({
      date: d.date.toISOString(),
      commentsDetected: d.commentsDetected,
      dmsSent: d.dmsSent,
      dmsFailed: d.dmsFailed,
    })),
    recentInvoices: extras.recentInvoices.map((inv) => ({
      id: inv.id ?? '',
      amountPaid: inv.amountPaid,
      currency: inv.currency,
      status: inv.status ?? null,
      createdAt: inv.createdAt,
      hostedInvoiceUrl: inv.hostedInvoiceUrl ?? null,
    })),
    recentAuditEvents: extras.recentAuditEvents.map((e) => ({
      action: e.action,
      createdAt: e.createdAt.toISOString(),
    })),
    recentAdminActions: extras.recentAdminActions.map((a) => ({
      action: a.action,
      reason: a.reason,
      actorEmail: a.actor.email,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

export function toAdminDashboardDto(stats: AdminDashboardDto): AdminDashboardDto {
  return stats;
}
