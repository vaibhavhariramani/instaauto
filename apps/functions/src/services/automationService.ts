import type { AutomationInput, UpdateAutomationInput } from '@instaauto/shared';
import {
  InstagramAccountStatus,
  NotificationType,
  type Automation,
  type MatchType,
  type Prisma,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/errors';
import { notificationService } from './notificationService';
import { instagramService } from './instagramService';
import { decryptAccountToken } from './instagramConnectService';
import { logger } from '../lib/logger';

// Per-account cooldown so rapid repeat list loads (switching tabs, pull-to-refresh)
// don't each fire a fresh round of Graph API calls - lives only for this instance's
// lifetime, which is fine, it's just a rate-limit/latency guard, not correctness.
const lastThumbnailRefreshAt = new Map<string, number>();
const THUMBNAIL_REFRESH_COOLDOWN_MS = 5 * 60_000;

export async function listAutomations(userId: string) {
  const automations = await prisma.automation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  // Reel thumbnail URLs are signed CDN links that expire - they do need refreshing
  // eventually - but doing that against the live Graph API in the request path made
  // every single list load pay a multi-second network round trip per connected
  // account. Return what's already in the DB immediately and let the refresh
  // happen in the background; the next load picks up the freshened URLs.
  void refreshStaleThumbnails(automations);
  return automations;
}

/**
 * Instagram's `thumbnail_url` is a signed CDN URL that expires within hours/days, but
 * automations store a snapshot of it at creation time — so older automations end up with dead
 * thumbnails. Refresh from the live Graph API per connected account and persist the refreshed
 * URL; best-effort, since a failed refresh (rate limit, revoked token, etc.) should never break
 * the automations list itself.
 */
async function refreshStaleThumbnails(automations: Automation[]): Promise<Automation[]> {
  const accountIds = [...new Set(automations.map((a) => a.instagramAccountId))].filter((id) => {
    const last = lastThumbnailRefreshAt.get(id);
    return !last || Date.now() - last > THUMBNAIL_REFRESH_COOLDOWN_MS;
  });
  if (accountIds.length === 0) return automations;
  for (const id of accountIds) lastThumbnailRefreshAt.set(id, Date.now());

  const accounts = await prisma.instagramAccount.findMany({
    where: { id: { in: accountIds }, status: InstagramAccountStatus.CONNECTED },
  });

  const thumbnailByReelId = new Map<string, string>();
  await Promise.all(
    accounts.map(async (account) => {
      try {
        const token = decryptAccountToken(account);
        const reels = await instagramService.getReels(account.instagramBusinessId, token);
        for (const reel of reels) {
          if (reel.thumbnailUrl) thumbnailByReelId.set(reel.id, reel.thumbnailUrl);
        }
      } catch (err) {
        logger.warn(
          { err, accountId: account.id },
          'Failed to refresh reel thumbnails for account',
        );
      }
    }),
  );
  if (thumbnailByReelId.size === 0) return automations;

  const updates: Promise<unknown>[] = [];
  const refreshed = automations.map((a) => {
    const fresh = thumbnailByReelId.get(a.reelId);
    if (!fresh || fresh === a.reelThumbnailUrl) return a;
    updates.push(
      prisma.automation
        .update({ where: { id: a.id }, data: { reelThumbnailUrl: fresh } })
        .catch(() => undefined),
    );
    return { ...a, reelThumbnailUrl: fresh };
  });
  if (updates.length > 0) await Promise.all(updates);

  return refreshed;
}

export async function getAutomation(userId: string, id: string) {
  const automation = await prisma.automation.findFirst({ where: { id, userId } });
  if (!automation) throw ApiError.notFound('Automation not found');
  return automation;
}

export async function createAutomation(userId: string, input: AutomationInput) {
  const account = await prisma.instagramAccount.findFirst({
    where: { id: input.instagramAccountId, userId, status: InstagramAccountStatus.CONNECTED },
  });
  if (!account) throw ApiError.badRequest('Select a connected Instagram account');

  const automation = await prisma.automation.create({
    data: {
      userId,
      instagramAccountId: input.instagramAccountId,
      name: input.name,
      reelId: input.reelId,
      reelThumbnailUrl: input.reelThumbnailUrl,
      reelPermalink: input.reelPermalink,
      reelCaption: input.reelCaption,
      triggerKeywords: input.triggerKeywords,
      matchType: input.matchType as MatchType,
      replyMessage: input.replyMessage,
      templateId: input.templateId || null,
      dmOncePerUser: input.dmOncePerUser,
      ignoreCreatorComments: input.ignoreCreatorComments,
      isActive: input.isActive,
    },
  });

  if (input.templateId) {
    await prisma.template
      .update({
        where: { id: input.templateId },
        data: { usageCount: { increment: 1 } },
      })
      .catch(() => undefined);
  }

  if (automation.isActive) {
    await notificationService.create(
      userId,
      NotificationType.AUTOMATION_STARTED,
      'Automation activated',
      `"${automation.name}" is now live and watching for comments.`,
    );
  }

  return automation;
}

export async function updateAutomation(userId: string, id: string, input: UpdateAutomationInput) {
  await getAutomation(userId, id);
  const automation = await prisma.automation.update({
    where: { id },
    data: input as Prisma.AutomationUpdateInput,
  });
  return automation;
}

export async function deleteAutomation(userId: string, id: string): Promise<void> {
  await getAutomation(userId, id);
  await prisma.automation.delete({ where: { id } });
}
