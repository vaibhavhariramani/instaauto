import { NotificationType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { matchKeyword } from './automationMatcher';
import { sendAutomationReply } from './dmService';
import { bumpDailyCounters } from './analyticsRollup';
import { notificationService } from './notificationService';
import { logger } from '../lib/logger';

export interface CommentEvent {
  instagramAccountId: string; // internal InstagramAccount.id
  reelId: string; // Instagram media id
  instagramCommentId: string;
  commenterIgUserId: string;
  commenterUsername: string;
  text: string;
}

/**
 * Core automation pipeline: takes one inbound comment event (from a real Meta webhook or the
 * mock simulate-comment endpoint) and applies matching, dedupe, ignore-creator, and DM dispatch.
 */
export async function processCommentEvent(event: CommentEvent): Promise<void> {
  const existing = await prisma.comment.findUnique({ where: { instagramCommentId: event.instagramCommentId } });
  if (existing) {
    logger.info({ instagramCommentId: event.instagramCommentId }, 'Comment already processed, skipping');
    return;
  }

  const account = await prisma.instagramAccount.findUnique({ where: { id: event.instagramAccountId } });
  if (!account || account.status !== 'CONNECTED') {
    logger.warn({ event }, 'No connected Instagram account for comment event');
    return;
  }

  const automations = await prisma.automation.findMany({
    where: { instagramAccountId: account.id, reelId: event.reelId, isActive: true },
  });
  if (automations.length === 0) return;

  await bumpDailyCounters(account.userId, { commentsDetected: 1 });

  const isCreatorComment = event.commenterIgUserId === account.instagramBusinessId;

  for (const automation of automations) {
    if (isCreatorComment && automation.ignoreCreatorComments) {
      await prisma.comment.create({
        data: {
          automationId: automation.id,
          instagramCommentId: event.instagramCommentId,
          commenterIgUserId: event.commenterIgUserId,
          commenterUsername: event.commenterUsername,
          text: event.text,
          isCreatorComment: true,
          processedAt: new Date(),
        },
      });
      continue;
    }

    const matchedKeyword = matchKeyword(event.text, automation.triggerKeywords, automation.matchType);

    let isDuplicate = false;
    if (matchedKeyword && automation.dmOncePerUser) {
      const priorMessage = await prisma.message.findFirst({
        where: {
          automationId: automation.id,
          recipientIgUserId: event.commenterIgUserId,
          status: { in: ['PENDING', 'SENT', 'DELIVERED', 'RETRYING'] },
        },
      });
      isDuplicate = Boolean(priorMessage);
    }

    const comment = await prisma.comment.create({
      data: {
        automationId: automation.id,
        instagramCommentId: event.instagramCommentId,
        commenterIgUserId: event.commenterIgUserId,
        commenterUsername: event.commenterUsername,
        text: event.text,
        matchedKeyword,
        isDuplicate,
        processedAt: new Date(),
      },
    });

    if (!matchedKeyword) continue;

    await prisma.automation.update({ where: { id: automation.id }, data: { totalTriggers: { increment: 1 } } });
    await notificationService.create(
      account.userId,
      NotificationType.KEYWORD_MATCHED,
      'Keyword matched',
      `@${event.commenterUsername} commented "${matchedKeyword}" on "${automation.name}".`,
    );

    if (isDuplicate) continue;

    await sendAutomationReply(automation, account, comment);
  }
}
