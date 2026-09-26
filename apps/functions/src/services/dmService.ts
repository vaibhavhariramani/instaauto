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
  // Instagram won't let us check follow status until this person has sent an inbound DM (a
  // comment/our own private reply doesn't establish that consent window) - so the CTA can't be
  // gated on the very first message. Send the follow-ask instead; conversationService resolves
  // the gate (and sends the real replyMessage) once they reply and the check becomes possible.
  const gated = automation.requireFollowBeforeCta && automation.followGateMessage;
  const content = renderTemplate(gated ? automation.followGateMessage! : automation.replyMessage, {
    username: comment.commenterUsername,
    reelTitle: automation.reelCaption ?? undefined,
  });

  if (gated) {
    await prisma.followGateState.upsert({
      where: {
        instagramAccountId_participantIgUserId_automationId: {
          instagramAccountId: account.id,
          participantIgUserId: comment.commenterIgUserId,
          automationId: automation.id,
        },
      },
      create: {
        instagramAccountId: account.id,
        participantIgUserId: comment.commenterIgUserId,
        automationId: automation.id,
      },
      update: { asksSent: 1 },
    });
  }

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

const MAX_FOLLOW_GATE_ASKS = 2;

/**
 * Called from conversationService.processMessagingEvent for every INBOUND message — this is the
 * only point Instagram lets us check is_user_follow_business (see sendAutomationReply). Resolves
 * every open follow-gate for this participant: sends the real CTA if they now follow (or we've
 * already asked twice), otherwise resends the follow-ask and counts the attempt.
 */
export async function resolveFollowGatesForParticipant(
  instagramAccountId: string,
  participantIgUserId: string,
  participantUsername: string,
  accessToken: string,
): Promise<void> {
  const gates = await prisma.followGateState.findMany({
    where: { instagramAccountId, participantIgUserId },
    include: { automation: true },
  });
  if (gates.length === 0) return;

  for (const gate of gates) {
    const { automation } = gate;
    const { followsBusiness } = await instagramService.getFollowStatus(
      participantIgUserId,
      accessToken,
    );
    const giveUp = gate.asksSent >= MAX_FOLLOW_GATE_ASKS;
    const sendCta = followsBusiness || giveUp;

    const content = renderTemplate(
      sendCta ? automation.replyMessage : automation.followGateMessage!,
      {
        username: participantUsername,
        reelTitle: automation.reelCaption ?? undefined,
      },
    );

    try {
      await instagramService.sendMessage(participantIgUserId, content, accessToken);
      await prisma.message.create({
        data: {
          userId: automation.userId,
          automationId: automation.id,
          instagramAccountId,
          recipientIgUserId: participantIgUserId,
          recipientUsername: participantUsername,
          content,
          status: MessageStatus.SENT,
          sentAt: new Date(),
          deliveredAt: new Date(),
        },
      });

      if (sendCta) {
        await prisma.$transaction([
          prisma.automation.update({
            where: { id: automation.id },
            data: { totalDMsSent: { increment: 1 } },
          }),
          prisma.followGateState.delete({ where: { id: gate.id } }),
        ]);
      } else {
        await prisma.followGateState.update({
          where: { id: gate.id },
          data: { asksSent: { increment: 1 } },
        });
      }
      await bumpDailyCounters(automation.userId, { dmsSent: 1 });
    } catch (err) {
      const errorMessage = (err as Error).message || 'Unknown error sending DM';
      logger.warn({ err: errorMessage, gateId: gate.id }, 'Follow-gate message send failed');
      await bumpDailyCounters(automation.userId, { dmsFailed: 1 });
      await notificationService.create(
        automation.userId,
        NotificationType.DM_FAILED,
        'DM delivery failed',
        `Could not message @${participantUsername} — ${errorMessage}`,
      );
    }
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
