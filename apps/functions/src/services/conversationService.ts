import { InstagramAccountStatus, MessageDirection } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { instagramService } from './instagramService';
import { decryptAccountToken } from './instagramConnectService';
import { resolveFollowGatesForParticipant } from './dmService';
import { upsertConversationMessage } from './conversationUpsert';
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
  const existingConversation = await prisma.conversation.findUnique({
    where: {
      instagramAccountId_participantIgUserId: {
        instagramAccountId: event.instagramAccountId,
        participantIgUserId: event.otherPartyIgUserId,
      },
    },
  });

  // Only spend a Graph API call on a username lookup the first time we see this participant -
  // on every later message we already have it on the existing conversation row.
  const participantUsername = existingConversation
    ? existingConversation.participantUsername
    : (await instagramService.getUserProfileByIgsid(event.otherPartyIgUserId, event.accessToken))
        .username;

  const inserted = await upsertConversationMessage({
    instagramAccountId: event.instagramAccountId,
    participantIgUserId: event.otherPartyIgUserId,
    participantUsername,
    direction: event.direction,
    content: event.content,
    externalMessageId: event.externalMessageId,
    timestamp: event.timestamp,
  });
  // A redelivered webhook (Meta retries on timeout) must not repeat the follow-gate check below.
  if (!inserted) return;

  // An inbound reply is the earliest point Instagram allows a follow-status check (see
  // dmService.sendAutomationReply) - this is where any pending "please follow" gate resolves.
  if (event.direction === MessageDirection.INBOUND) {
    await resolveFollowGatesForParticipant(
      event.instagramAccountId,
      event.otherPartyIgUserId,
      participantUsername,
      event.accessToken,
    );
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

export async function sendMessageToConversation(
  userId: string,
  instagramAccountId: string,
  conversationId: string,
  content: string,
) {
  const account = await requireConnectedAccount(userId, instagramAccountId);
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, instagramAccountId },
  });
  if (!conversation) throw ApiError.notFound('Conversation not found');

  const token = decryptAccountToken(account);
  const sent = await instagramService.sendMessage(conversation.participantIgUserId, content, token);

  const [message] = await prisma.$transaction([
    prisma.directMessage.create({
      data: {
        conversationId,
        direction: MessageDirection.OUTBOUND,
        content,
        externalMessageId: sent.externalMessageId,
        createdAt: new Date(),
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: content.slice(0, 200),
        lastMessageDirection: MessageDirection.OUTBOUND,
      },
    }),
  ]);

  return message;
}
