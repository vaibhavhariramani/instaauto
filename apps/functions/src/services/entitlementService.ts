import { PLAN_TIERS, type SubscriptionPlan } from '@instaauto/shared';
import { SubscriptionStatus, type User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/errors';

const ENTITLED_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
];

/**
 * The plan that actually governs a user's limits right now — never read `user.subscriptionPlan`
 * on its own for authorization. A PRO/BUSINESS plan whose payment has lapsed (PAST_DUE, CANCELED)
 * or was never verified (NONE — e.g. checkout was only started) must not keep paid-tier limits
 * just because the column still says PRO: Starter's limits apply until a verified ACTIVE/TRIALING
 * status is restored. The `subscriptionPlan` column itself is left untouched in that case (so the
 * UI/support can still show "was on Pro, payment lapsed" rather than silently forgetting it).
 */
export function getEffectivePlan(
  user: Pick<User, 'subscriptionPlan' | 'subscriptionStatus'>,
): SubscriptionPlan {
  if (user.subscriptionPlan !== 'STARTER' && ENTITLED_STATUSES.includes(user.subscriptionStatus)) {
    return user.subscriptionPlan;
  }
  return 'STARTER';
}

export function getEffectiveTier(user: Pick<User, 'subscriptionPlan' | 'subscriptionStatus'>) {
  return PLAN_TIERS[getEffectivePlan(user)];
}

/**
 * Start of the current DM-usage window. Paid, verified subscriptions use Stripe's own billing
 * period (synced onto subscriptionCurrentPeriodStart by the webhook) so usage resets align with
 * what the customer is actually being charged for. Starter/unverified accounts have no such
 * period, so they fall back to the calendar month — the only sensible default when there's no
 * provider period to anchor to.
 */
function billingPeriodStart(
  user: Pick<User, 'subscriptionStatus' | 'subscriptionCurrentPeriodStart'>,
): Date {
  if (ENTITLED_STATUSES.includes(user.subscriptionStatus) && user.subscriptionCurrentPeriodStart) {
    return user.subscriptionCurrentPeriodStart;
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Throws if creating (or reactivating) another automation would exceed the user's plan limit.
 * Runs the count-then-check inside a serializable transaction so two concurrent requests can't
 * both read "2 of 3 used" and both proceed — the second to commit gets a serialization failure
 * instead of silently exceeding the limit. Callers should let that error propagate as a normal
 * 500/retry rather than swallow it; a retry re-checks the (now up to date) count.
 */
export async function assertCanCreateAutomation(userId: string): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const tier = getEffectiveTier(user);
      if (tier.automationLimit === -1) return;
      const count = await tx.automation.count({ where: { userId, isActive: true } });
      if (count >= tier.automationLimit) {
        throw ApiError.forbidden(
          `Your ${tier.label} plan allows up to ${tier.automationLimit} active automation${tier.automationLimit === 1 ? '' : 's'}. Pause or delete one, or upgrade your plan to create another.`,
        );
      }
    },
    { isolationLevel: 'Serializable' },
  );
}

/**
 * Throws if connecting another Instagram account would exceed the user's plan limit. Callers are
 * responsible for only invoking this when the connect is actually new for this user (refreshing an
 * already-connected account, or an account this user already owns that's merely being
 * re-authorized, must not be blocked or double-counted) — see instagramConnectService.ts.
 */
export async function assertCanConnectInstagramAccount(userId: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const tier = getEffectiveTier(user);
  if (tier.instagramAccountLimit === -1) return;
  const count = await prisma.instagramAccount.count({ where: { userId, status: 'CONNECTED' } });
  if (count >= tier.instagramAccountLimit) {
    throw ApiError.forbidden(
      `Your ${tier.label} plan allows up to ${tier.instagramAccountLimit} connected Instagram account${tier.instagramAccountLimit === 1 ? '' : 's'}. Disconnect one, or upgrade your plan to connect another.`,
    );
  }
}

/** DMs sent so far in the user's current billing window - shared by canSendDM and the admin views. */
export async function dmUsageThisPeriod(
  user: Pick<User, 'id' | 'subscriptionStatus' | 'subscriptionCurrentPeriodStart'>,
): Promise<number> {
  const periodStart = billingPeriodStart(user);
  const agg = await prisma.analyticsDaily.aggregate({
    where: { userId: user.id, date: { gte: periodStart } },
    _sum: { dmsSent: true },
  });
  return agg._sum.dmsSent ?? 0;
}

/**
 * Whether the user still has DM quota left in their current billing window. Deliberately returns
 * a boolean rather than throwing — callers (dmService) need to mark the specific Message as
 * blocked-by-quota and notify the user, not hard-fail a webhook/retry job.
 */
export async function canSendDM(userId: string): Promise<boolean> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const tier = getEffectiveTier(user);
  if (tier.dmLimitPerMonth === -1) return true;
  const used = await dmUsageThisPeriod(user);
  return used < tier.dmLimitPerMonth;
}
