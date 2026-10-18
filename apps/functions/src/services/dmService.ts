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
import type { LinkButton, PostbackButton } from '../types/instagram';

function backoffMinutes(retryCount: number): number {
  return RETRY_BACKOFF_BASE_MINUTES * 2 ** retryCount;
}

/** One random variation per trigger - posting the identical comment every time reads as spam. */
function pickPublicReply(automation: Automation): string | null {
  if (!automation.publicReplyEnabled || automation.publicReplyMessages.length === 0) return null;
  const i = Math.floor(Math.random() * automation.publicReplyMessages.length);
  return automation.publicReplyMessages[i]!;
}

/** ctaLinkButtons is stored as Json - this is the only place that trusts its shape. */
function parseLinkButtons(automation: Automation): LinkButton[] {
  const raw = automation.ctaLinkButtons;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (b): b is { label: string; url: string } =>
        typeof b === 'object' &&
        b !== null &&
        typeof (b as Record<string, unknown>).label === 'string' &&
        typeof (b as Record<string, unknown>).url === 'string',
    )
    .slice(0, 3)
    .map((b) => ({ label: b.label, url: b.url }));
}

/** The opening DM's button - tapping it both satisfies the inbound-message consent gate (see
 * below) and reads like a real app flow ("Send me the link") instead of a wall of text. A
 * postback button (not a quick-reply chip) so it renders as a boxed button identical in style to
 * any web_url buttons on the same message - confirmed by live testing that quick-reply chips
 * render differently (and don't reliably show up at all alongside a template attachment). */
function openingPostbackButtons(automation: Automation): PostbackButton[] | undefined {
  return automation.openingButtonLabel
    ? [{ title: automation.openingButtonLabel, payload: 'OPENING_ASK' }]
    : undefined;
}

// Distinct from the automation's own followGateMessage - re-sending the identical ask verbatim
// on every reply reads as a broken bot repeating itself. This one is deliberately generic/fixed
// rather than a second per-automation text field to configure.
const FOLLOW_REMINDER_MESSAGE =
  "Hey! It seems you're not following me yet 👋 Would love it if you could check out my profile and hit follow 😊";

// Fixed system button, not per-automation config (same reasoning as FOLLOW_REMINDER_MESSAGE
// above) - tapping it fires a `postback` webhook event (handled in webhookService), which
// re-triggers resolveFollowGatesForParticipant and rechecks follow status, closing the "keep
// asking until they follow" loop. Renders alongside the automation's own followButtonLabel (a
// real web_url button to the creator's profile) in the same button-template card.
const FOLLOW_RECHECK_POSTBACK: PostbackButton = {
  title: "I'm following ✅",
  payload: 'FOLLOW_RECHECK',
};

export async function sendAutomationReply(
  automation: Automation,
  account: InstagramAccount,
  comment: Comment,
): Promise<void> {
  // Instagram won't let us check follow status until this person has sent an inbound DM (a
  // comment/our own private reply doesn't establish that consent window) - so the CTA can't be
  // gated on the very first message. Send the follow-ask instead; conversationService resolves
  // the gate (and sends the real replyMessage) once they reply, or the 24h sweep force-resolves
  // it per the automation's sendCtaIfNeverFollows policy.
  const gated = automation.requireFollowBeforeCta && automation.followGateMessage;
  const content = renderTemplate(gated ? automation.followGateMessage! : automation.replyMessage, {
    username: comment.commenterUsername,
    reelTitle: automation.reelCaption ?? undefined,
  });
  // The final (ungated) CTA can carry real clickable link buttons; the gated opening ask uses a
  // quick-reply instead, since its whole point is to produce a reply, not to send someone away.
  const linkButtons = gated ? undefined : parseLinkButtons(automation);

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

  const publicReplyTemplate = pickPublicReply(automation);
  if (publicReplyTemplate) {
    const publicReply = renderTemplate(publicReplyTemplate, {
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

  await attemptSend(
    message.id,
    comment.instagramCommentId,
    content,
    account,
    openingPostbackButtons(automation),
    linkButtons,
  );
}

async function attemptSend(
  messageId: string,
  instagramCommentId: string,
  content: string,
  account: InstagramAccount,
  postbackButtons?: PostbackButton[],
  linkButtons?: LinkButton[],
): Promise<void> {
  const message = await prisma.message.findUniqueOrThrow({ where: { id: messageId } });
  try {
    const token = decryptAccountToken(account);
    await instagramService.sendPrivateReply(
      instagramCommentId,
      content,
      token,
      postbackButtons,
      linkButtons,
    );

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

/**
 * Sends the final CTA (clearing the gate) or the follow-reminder (incrementing asksSent) for one
 * open gate. Shared by the reply-triggered path (resolveFollowGatesForParticipant) and the 24h
 * sweep (resolveStaleFollowGates) so both resolve a gate identically.
 */
async function resolveOneGate(
  gate: Awaited<ReturnType<typeof prisma.followGateState.findMany>>[number] & {
    automation: Automation;
  },
  accountUsername: string,
  participantIgUserId: string,
  participantUsername: string,
  accessToken: string,
  followsBusiness: boolean,
  forceResolve: boolean,
): Promise<void> {
  const { automation } = gate;
  const sendCta = followsBusiness || forceResolve;

  const content = sendCta
    ? renderTemplate(automation.replyMessage, {
        username: participantUsername,
        reelTitle: automation.reelCaption ?? undefined,
      })
    : FOLLOW_REMINDER_MESSAGE;

  const linkButtons = sendCta
    ? parseLinkButtons(automation)
    : automation.followButtonLabel
      ? [{ label: automation.followButtonLabel, url: `https://instagram.com/${accountUsername}` }]
      : undefined;
  const postbackButtons = sendCta ? undefined : [FOLLOW_RECHECK_POSTBACK];

  try {
    await instagramService.sendMessage(
      participantIgUserId,
      content,
      accessToken,
      postbackButtons,
      linkButtons,
    );
    await prisma.message.create({
      data: {
        userId: automation.userId,
        automationId: automation.id,
        instagramAccountId: gate.instagramAccountId,
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

/**
 * Called from conversationService.processMessagingEvent for every INBOUND message — this is the
 * only point Instagram lets us check is_user_follow_business (see sendAutomationReply). Resolves
 * every open follow-gate for this participant: sends the real CTA if they now follow, otherwise
 * resends the follow-reminder. Never force-resolves on its own — that's the 24h sweep's job
 * (resolveStaleFollowGates), gated on each automation's sendCtaIfNeverFollows policy.
 */
export async function resolveFollowGatesForParticipant(
  instagramAccountId: string,
  accountUsername: string,
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
    const { followsBusiness } = await instagramService.getFollowStatus(
      participantIgUserId,
      accessToken,
    );
    await resolveOneGate(
      gate,
      accountUsername,
      participantIgUserId,
      participantUsername,
      accessToken,
      followsBusiness,
      false,
    );
  }
}

const FOLLOW_GATE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Scheduled sweep (see index.ts cron wiring) - force-resolves any follow-gate older than 24h
 * whose automation has sendCtaIfNeverFollows on ("send the link anyway"). Gates belonging to an
 * automation with that policy off are left untouched indefinitely ("only followers get the
 * link"); they still resolve immediately the moment the recipient replies and is confirmed
 * following, via resolveFollowGatesForParticipant above.
 */
export async function resolveStaleFollowGates(limit = 100): Promise<{ resolved: number }> {
  const stale = await prisma.followGateState.findMany({
    where: {
      createdAt: { lte: new Date(Date.now() - FOLLOW_GATE_MAX_AGE_MS) },
      automation: { sendCtaIfNeverFollows: true },
    },
    include: { automation: true },
    take: limit,
  });
  if (stale.length === 0) return { resolved: 0 };

  const accountIds = [...new Set(stale.map((g) => g.instagramAccountId))];
  const accounts = await prisma.instagramAccount.findMany({ where: { id: { in: accountIds } } });
  const accountById = new Map(accounts.map((a) => [a.id, a]));

  for (const gate of stale) {
    const account = accountById.get(gate.instagramAccountId);
    if (!account) continue;
    const token = decryptAccountToken(account);
    // Participant username isn't tracked on the gate itself - "there" is accurate enough for a
    // message whose only job left is to deliver the link, not greet them by name.
    await resolveOneGate(
      gate,
      account.username,
      gate.participantIgUserId,
      'there',
      token,
      false,
      true,
    );
  }
  return { resolved: stale.length };
}

/** Re-attempts messages due for retry. Invoked by the scheduled retryFailedMessages job. */
export async function retryDueMessages(limit = 50): Promise<{ attempted: number }> {
  const due = await prisma.message.findMany({
    where: {
      status: MessageStatus.RETRYING,
      nextRetryAt: { lte: new Date() },
    },
    include: { comment: true, instagramAccount: true, automation: true },
    take: limit,
  });

  for (const msg of due) {
    if (!msg.comment) continue;
    await attemptSend(
      msg.id,
      msg.comment.instagramCommentId,
      msg.content,
      msg.instagramAccount,
      openingPostbackButtons(msg.automation),
      undefined,
    );
  }
  return { attempted: due.length };
}
