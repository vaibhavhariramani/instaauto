import { InstagramAccountStatus, MessageDirection } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { instagramService } from './instagramService';
import { generateReply } from './aiReplyService';
import { ApiError } from '../middleware/errors';
import { logger } from '../lib/logger';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface MessagingEventInput {
  instagramAccountId: string; // internal InstagramAccount.id
  otherPartyIgUserId: string;
  direction: MessageDirection;
  content: string;
  externalMessageId: string;
  timestamp: Date;
  accessToken: string;
}

/** Upserts the conversation thread and appends one message, deduping by Instagram's own message id. */
export async function processMessagingEvent(event: MessagingEventInput): Promise<void> {
  const existing = await prisma.directMessage.findUnique({
    where: { externalMessageId: event.externalMessageId },
  });
  if (existing) return;

  let conversation = await prisma.conversation.findUnique({
    where: {
      instagramAccountId_participantIgUserId: {
        instagramAccountId: event.instagramAccountId,
        participantIgUserId: event.otherPartyIgUserId,
      },
    },
  });

  const preview = event.content.slice(0, 200);

  if (!conversation) {
    const profile = await instagramService.getUserProfileByIgsid(
      event.otherPartyIgUserId,
      event.accessToken,
    );
    conversation = await prisma.conversation.create({
      data: {
        instagramAccountId: event.instagramAccountId,
        participantIgUserId: event.otherPartyIgUserId,
        participantUsername: profile.username,
        lastMessageAt: event.timestamp,
        lastMessagePreview: preview,
        lastMessageDirection: event.direction,
      },
    });
  } else {
    conversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: event.timestamp,
        lastMessagePreview: preview,
        lastMessageDirection: event.direction,
      },
    });
  }

  await prisma.directMessage.create({
    data: {
      conversationId: conversation.id,
      direction: event.direction,
      content: event.content,
      externalMessageId: event.externalMessageId,
      createdAt: event.timestamp,
    },
  });

  if (event.direction === MessageDirection.INBOUND) {
    await maybeSendAiReply(
      event.instagramAccountId,
      conversation.id,
      event.otherPartyIgUserId,
      event.content,
      event.accessToken,
    );
  }
}

/**
 * Fires an AI-generated fallback reply for an organic inbound DM, when the account has it
 * enabled. Best-effort: any failure here is logged and swallowed — it must never break inbound
 * message logging, which has already happened by the time this runs.
 */
async function maybeSendAiReply(
  instagramAccountId: string,
  conversationId: string,
  recipientIgUserId: string,
  incomingText: string,
  accessToken: string,
): Promise<void> {
  try {
    const settings = await prisma.aiReplySettings.findUnique({ where: { instagramAccountId } });
    if (!settings?.enabled) return;

    const history = await prisma.directMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    const replyText = await generateReply({
      personaPrompt: settings.personaPrompt,
      history: history.reverse().map((m) => ({ direction: m.direction, content: m.content })),
      incomingText,
    });
    if (!replyText) return;

    await wait(1000 + Math.random() * 1000);

    const result = await instagramService.sendTextDM(recipientIgUserId, replyText, accessToken);
    await prisma.directMessage.create({
      data: {
        conversationId,
        direction: MessageDirection.OUTBOUND,
        content: replyText,
        externalMessageId: result.externalMessageId,
      },
    });
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: replyText.slice(0, 200),
        lastMessageDirection: MessageDirection.OUTBOUND,
      },
    });
  } catch (err) {
    logger.warn({ err: (err as Error).message, instagramAccountId }, 'AI auto-reply failed');
  }
}

async function requireConnectedAccount(userId: string, instagramAccountId: string) {
  const account = await prisma.instagramAccount.findFirst({
    where: { id: instagramAccountId, userId, status: InstagramAccountStatus.CONNECTED },
  });
  if (!account) throw ApiError.notFound('Connected Instagram account not found');
  return account;
}

export async function listConversationsForAccount(userId: string, instagramAccountId: string) {
  await requireConnectedAccount(userId, instagramAccountId);
  return prisma.conversation.findMany({
    where: { instagramAccountId },
    orderBy: { lastMessageAt: 'desc' },
  });
}

export async function listMessagesForConversation(
  userId: string,
  instagramAccountId: string,
  conversationId: string,
) {
  await requireConnectedAccount(userId, instagramAccountId);
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, instagramAccountId },
  });
  if (!conversation) throw ApiError.notFound('Conversation not found');

  const messages = await prisma.directMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });

  return { conversation, messages };
}
