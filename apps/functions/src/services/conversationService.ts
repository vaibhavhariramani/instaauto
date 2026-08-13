import { InstagramAccountStatus, MessageDirection } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { instagramService } from './instagramService';
import { ApiError } from '../middleware/errors';

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
    const profile = await instagramService.getUserProfileByIgsid(event.otherPartyIgUserId, event.accessToken);
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
      data: { lastMessageAt: event.timestamp, lastMessagePreview: preview, lastMessageDirection: event.direction },
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
