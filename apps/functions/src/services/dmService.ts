import { MAX_DM_RETRY_ATTEMPTS, RETRY_BACKOFF_BASE_MINUTES } from '@instaauto/shared';
import {
  MessageStatus,
  NotificationType,
  type Automation,
  type Comment,
  type InstagramAccount,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { instagramService } from './instagramService';
import { decryptAccountToken } from './instagramConnectService';
import { renderTemplate } from './automationMatcher';
import { bumpDailyCounters } from './analyticsRollup';
import { notificationService } from './notificationService';
import { logger } from '../lib/logger';

function backoffMinutes(retryCount: number): number {
  return RETRY_BACKOFF_BASE_MINUTES * 2 ** retryCount;
}

export async function sendAutomationReply(
  automation: Automation,
  account: InstagramAccount,
  comment: Comment,
): Promise<void> {
  const content = renderTemplate(automation.replyMessage, {
    username: comment.commenterUsername,
    reelTitle: automation.reelCaption ?? undefined,
  });

  if (automation.publicReplyEnabled && automation.publicReplyMessage) {
    const publicReply = renderTemplate(automation.publicReplyMessage, {
      username: comment.commenterUsername,
      reelTitle: automation.reelCaption ?? undefined,
    });
    try {
      const token = decryptAccountToken(account);
      await instagramService.replyToComment(comment.instagramCommentId, publicReply, token);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Unknown error';
      logger.warn(
        { err: errorMessage, commentId: comment.id },
        'Public comment reply failed, continuing to DM',
      );
      // Previously silent — the DM below still sends, but the user had no way to find out the
      // public reply never posted short of checking server logs they don't have access to.
      await notificationService.create(
        automation.userId,
        NotificationType.DM_FAILED,
        'Public reply failed',
        `Could not post a public reply for "${automation.name}" — ${errorMessage}. The DM was still sent.`,
      );
    }
  }

  const message = await prisma.message.create({
    data: {
      userId: automation.userId,
      automationId: automation.id,
      commentId: comment.id,
      instagramAccountId: account.id,
      recipientIgUserId: comment.commenterIgUserId,
      recipientUsername: comment.commenterUsername,
      content,
      status: MessageStatus.PENDING,
    },
  });

  await attemptSend(message.id, comment.instagramCommentId, content, account);
}

async function attemptSend(
  messageId: string,
  instagramCommentId: string,
  content: string,
  account: InstagramAccount,
): Promise<void> {
  const message = await prisma.message.findUniqueOrThrow({ where: { id: messageId } });
  try {
    const token = decryptAccountToken(account);
    await instagramService.sendPrivateReply(instagramCommentId, content, token);

    await prisma.$transaction([
      prisma.message.update({
        where: { id: messageId },
        data: { status: MessageStatus.SENT, sentAt: new Date(), deliveredAt: new Date() },
      }),
      prisma.automation.update({
        where: { id: message.automationId },
        data: { totalDMsSent: { increment: 1 } },
      }),
    ]);
    await bumpDailyCounters(message.userId, { dmsSent: 1 });
  } catch (err) {
    const errorMessage = (err as Error).message || 'Unknown error sending DM';
    const retryCount = message.retryCount + 1;
    const canRetry = retryCount < MAX_DM_RETRY_ATTEMPTS;

    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: canRetry ? MessageStatus.RETRYING : MessageStatus.FAILED,
        errorMessage,
        retryCount,
        nextRetryAt: canRetry
          ? new Date(Date.now() + backoffMinutes(retryCount) * 60 * 1000)
          : null,
      },
    });
    await bumpDailyCounters(message.userId, { dmsFailed: 1 });

    logger.warn({ messageId, errorMessage, retryCount }, 'DM send failed');
    await notificationService.create(
      message.userId,
      NotificationType.DM_FAILED,
      'DM delivery failed',
      `Could not message @${message.recipientUsername} — ${errorMessage}`,
    );
  }
}

/** Re-attempts messages due for retry. Invoked by the scheduled retryFailedMessages job. */
export async function retryDueMessages(limit = 50): Promise<{ attempted: number }> {
  const due = await prisma.message.findMany({
    where: {
      status: MessageStatus.RETRYING,
      nextRetryAt: { lte: new Date() },
    },
    include: { comment: true, instagramAccount: true },
    take: limit,
  });

  for (const msg of due) {
    if (!msg.comment) continue;
    await attemptSend(msg.id, msg.comment.instagramCommentId, msg.content, msg.instagramAccount);
  }
  return { attempted: due.length };
}
