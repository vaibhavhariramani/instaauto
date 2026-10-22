import {
  PLAN_TIERS,
  type AdminUpdateUserPlanInput,
  type AdminUserListQuery,
} from '@instaauto/shared';
import { InstagramAccountStatus, SubscriptionStatus, type SubscriptionPlan } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/errors';
import { getEffectiveTier, dmUsageThisPeriod } from './entitlementService';
import * as stripeService from './stripeService';
import {
  toAdminUserListItemDto,
  toAdminUserDetailDto,
  toAdminDashboardDto,
} from '../utils/adminMappers';

const ENTITLED_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
];

export async function getDashboard() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersLast7Days,
    newUsersLast30Days,
    planCountsRaw,
    activePaidSubscriptions,
    pastDueSubscriptions,
    totalActiveAutomations,
    dmsLast30DaysAgg,
    activePaidUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.groupBy({ by: ['subscriptionPlan'], _count: true }),
    prisma.user.count({
      where: { subscriptionPlan: { not: 'STARTER' }, subscriptionStatus: 'ACTIVE' },
    }),
    prisma.user.count({ where: { subscriptionStatus: 'PAST_DUE' } }),
    prisma.automation.count({ where: { isActive: true } }),
    prisma.analyticsDaily.aggregate({
      where: { date: { gte: thirtyDaysAgo } },
      _sum: { dmsSent: true },
    }),
    // Needed to compute the MRR estimate - only verified ACTIVE/TRIALING paid subscribers count.
    prisma.user.findMany({
      where: {
        subscriptionPlan: { not: 'STARTER' },
        subscriptionStatus: { in: ENTITLED_STATUSES },
      },
      select: { subscriptionPlan: true },
    }),
  ]);

  const planCounts = { STARTER: 0, PRO: 0, BUSINESS: 0 } as Record<SubscriptionPlan, number>;
  for (const row of planCountsRaw) planCounts[row.subscriptionPlan] = row._count;

  const estimatedMrr = activePaidUsers.reduce(
    (sum, u) => sum + PLAN_TIERS[u.subscriptionPlan].priceMonthly,
    0,
  );

  return toAdminDashboardDto({
    totalUsers,
    newUsersLast7Days,
    newUsersLast30Days,
    planCounts,
    activePaidSubscriptions,
    pastDueSubscriptions,
    totalActiveAutomations,
    dmsSentLast30Days: dmsLast30DaysAgg._sum.dmsSent ?? 0,
    estimatedMrr,
  });
}

export async function listUsers(query: AdminUserListQuery) {
  const where = {
    ...(query.plan ? { subscriptionPlan: query.plan } : {}),
    ...(query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' as const } },
            { name: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        isAdmin: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionCurrentPeriodStart: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  // _count with a filtered relation isn't directly expressible in one typed query across Prisma
  // versions reliably - compute the two counts per-user explicitly instead, and the per-user DM
  // usage (needs the billing-period math, not a plain count) the same way.
  const items = await Promise.all(
    users.map(async (u) => {
      const [connectedAccountsCount, activeAutomationsCount, dmsSentThisPeriod] = await Promise.all(
        [
          prisma.instagramAccount.count({
            where: { userId: u.id, status: InstagramAccountStatus.CONNECTED },
          }),
          prisma.automation.count({ where: { userId: u.id, isActive: true } }),
          dmUsageThisPeriod(u),
        ],
      );
      return toAdminUserListItemDto(u, {
        connectedAccountsCount,
        activeAutomationsCount,
        dmsSentThisPeriod,
      });
    }),
  );

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function getUserDetail(targetUserId: string) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw ApiError.notFound('User not found');

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [
    connectedAccounts,
    automations,
    dmsSentThisPeriod,
    usageHistory,
    auditEvents,
    adminActions,
    invoices,
  ] = await Promise.all([
    prisma.instagramAccount.findMany({
      where: { userId: targetUserId },
      orderBy: { connectedAt: 'desc' },
    }),
    prisma.automation.findMany({ where: { userId: targetUserId }, orderBy: { createdAt: 'desc' } }),
    dmUsageThisPeriod(user),
    prisma.analyticsDaily.findMany({
      where: { userId: targetUserId, date: { gte: ninetyDaysAgo } },
      orderBy: { date: 'asc' },
    }),
    prisma.auditLog.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.adminActionLog.findMany({
      where: { targetUserId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { actor: { select: { email: true } } },
    }),
    // Best-effort - a Stripe outage or missing config must not break the whole detail view.
    stripeService.listInvoices(user).catch(() => []),
  ]);

  const tier = getEffectiveTier(user);

  return toAdminUserDetailDto(user, {
    connectedAccounts,
    automations,
    dmsSentThisPeriod,
    dmLimitPerMonth: tier.dmLimitPerMonth,
    usageHistory,
    recentInvoices: invoices,
    recentAuditEvents: auditEvents,
    recentAdminActions: adminActions,
  });
}

export async function updateUserPlan(
  actorId: string,
  targetUserId: string,
  input: AdminUpdateUserPlanInput,
) {
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw ApiError.notFound('User not found');

  const before = {
    subscriptionPlan: target.subscriptionPlan,
    subscriptionStatus: target.subscriptionStatus,
  };
  // A manual override always sets a verified-equivalent ACTIVE status - there's no real Stripe
  // subscription behind it, so leaving the prior (possibly NONE/PAST_DUE) status would make this
  // override silently not grant anything, per entitlementService's effective-plan logic.
  const after = { subscriptionPlan: input.plan, subscriptionStatus: SubscriptionStatus.ACTIVE };

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({ where: { id: targetUserId }, data: after });
    await tx.adminActionLog.create({
      data: {
        actorId,
        targetUserId,
        action: 'admin.update_user_plan',
        reason: input.reason,
        before,
        after,
      },
    });
    return u;
  });

  return updated;
}
