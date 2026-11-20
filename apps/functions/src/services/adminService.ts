import {
  PLAN_TIERS,
  type AdminAutomationListQuery,
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
  toAdminAutomationListItemDto,
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

// Computed-column sorts (accounts/automations/DMs) can't be expressed as a DB ORDER BY, so they
// load every matching user (bounded here), compute metrics in bulk, sort in memory and slice the
// page. Plain-column sorts stay fully in the database and are paginated there.
const MAX_USERS_FOR_COMPUTED_SORT = 1000;

const USER_LIST_SELECT = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  isAdmin: true,
  subscriptionPlan: true,
  subscriptionStatus: true,
  subscriptionCurrentPeriodStart: true,
} as const;

type UserListRow = Awaited<
  ReturnType<typeof prisma.user.findMany<{ select: typeof USER_LIST_SELECT }>>
>[number];

async function userMetrics(users: UserListRow[]) {
  const ids = users.map((u) => u.id);
  const [accountRows, automationRows, dmCounts] = await Promise.all([
    prisma.instagramAccount.groupBy({
      by: ['userId'],
      where: { userId: { in: ids }, status: InstagramAccountStatus.CONNECTED },
      _count: { _all: true },
    }),
    prisma.automation.groupBy({
      by: ['userId'],
      where: { userId: { in: ids }, isActive: true },
      _count: { _all: true },
    }),
    Promise.all(users.map((u) => dmUsageThisPeriod(u))),
  ]);

  const accounts = new Map(accountRows.map((r) => [r.userId, r._count._all]));
  const automations = new Map(automationRows.map((r) => [r.userId, r._count._all]));
  return users.map((u, i) => ({
    user: u,
    connectedAccountsCount: accounts.get(u.id) ?? 0,
    activeAutomationsCount: automations.get(u.id) ?? 0,
    dmsSentThisPeriod: dmCounts[i] ?? 0,
  }));
}

export async function listUsers(query: AdminUserListQuery) {
  const where = {
    ...(query.plan === 'PAID'
      ? { subscriptionPlan: { not: 'STARTER' as const } }
      : query.plan
        ? { subscriptionPlan: query.plan }
        : {}),
    ...(query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' as const } },
            { name: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };
  const dir = query.sortDir;
  const toDto = (r: Awaited<ReturnType<typeof userMetrics>>[number]) =>
    toAdminUserListItemDto(r.user, {
      connectedAccountsCount: r.connectedAccountsCount,
      activeAutomationsCount: r.activeAutomationsCount,
      dmsSentThisPeriod: r.dmsSentThisPeriod,
    });

  const computedKey = (
    {
      accounts: 'connectedAccountsCount',
      automations: 'activeAutomationsCount',
      dms: 'dmsSentThisPeriod',
    } as const
  )[query.sortBy as 'accounts' | 'automations' | 'dms'];

  if (computedKey) {
    const [all, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: MAX_USERS_FOR_COMPUTED_SORT,
        select: USER_LIST_SELECT,
      }),
      prisma.user.count({ where }),
    ]);
    const rows = await userMetrics(all);
    const sign = dir === 'asc' ? 1 : -1;
    rows.sort((a, b) => sign * (a[computedKey] - b[computedKey]));
    const pageRows = rows.slice((query.page - 1) * query.pageSize, query.page * query.pageSize);
    return { items: pageRows.map(toDto), total, page: query.page, pageSize: query.pageSize };
  }

  const orderBy = {
    name: { name: dir },
    plan: { subscriptionPlan: dir },
    status: { subscriptionStatus: dir },
    joined: { createdAt: dir },
  }[query.sortBy as 'name' | 'plan' | 'status' | 'joined'];

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [orderBy, { id: 'asc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: USER_LIST_SELECT,
    }),
    prisma.user.count({ where }),
  ]);
  const rows = await userMetrics(users);
  return { items: rows.map(toDto), total, page: query.page, pageSize: query.pageSize };
}

export async function listAutomations(query: AdminAutomationListQuery) {
  const where = query.search
    ? {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { user: { email: { contains: query.search, mode: 'insensitive' as const } } },
          { user: { name: { contains: query.search, mode: 'insensitive' as const } } },
        ],
      }
    : {};

  const dir = query.sortDir;
  const orderBy = {
    name: { name: dir },
    owner: { user: { email: dir } },
    status: { isActive: dir },
    triggers: { totalTriggers: dir },
    dms: { totalDMsSent: dir },
    created: { createdAt: dir },
  }[query.sortBy];

  const [rows, total] = await Promise.all([
    prisma.automation.findMany({
      where,
      orderBy: [orderBy, { id: 'asc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { user: { select: { id: true, email: true, name: true } } },
    }),
    prisma.automation.count({ where }),
  ]);

  return {
    items: rows.map(toAdminAutomationListItemDto),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
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
