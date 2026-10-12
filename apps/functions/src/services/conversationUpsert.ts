import { MessageDirection } from '@prisma/client';
import { prisma } from '../lib/prisma';

interface UpsertMessageInput {
  instagramAccountId: string;
  participantIgUserId: string;
  participantUsername: string;
  direction: MessageDirection;
  content: string;
  externalMessageId: string;
  timestamp?: Date;
}

/**
 * Upserts the conversation thread and appends one message, deduping by Instagram's own message
 * id. Shared by conversationService (inbound webhook events) and dmService (every outbound DM an
 * automation sends) so the inbox reflects automation sends immediately instead of depending on a
 * separate messaging-webhook echo that may never arrive for a given account/message.
 *
 * Returns false (and does nothing else) when externalMessageId was already recorded - callers
 * that run follow-up side effects only on a genuinely new message (e.g. follow-gate resolution)
 * must check this, since a redelivered webhook must not repeat those side effects.
 */
export async function upsertConversationMessage(input: UpsertMessageInput): Promise<boolean> {
  const timestamp = input.timestamp ?? new Date();
  const existing = await prisma.directMessage.findUnique({
    where: { externalMessageId: input.externalMessageId },
  });
  if (existing) return false;

  const preview = input.content.slice(0, 200);

  const conversation = await prisma.conversation.upsert({
    where: {
      instagramAccountId_participantIgUserId: {
        instagramAccountId: input.instagramAccountId,
        participantIgUserId: input.participantIgUserId,
      },
    },
    create: {
      instagramAccountId: input.instagramAccountId,
      participantIgUserId: input.participantIgUserId,
      participantUsername: input.participantUsername,
      lastMessageAt: timestamp,
      lastMessagePreview: preview,
      lastMessageDirection: input.direction,
    },
    update: {
      lastMessageAt: timestamp,
      lastMessagePreview: preview,
      lastMessageDirection: input.direction,
      participantUsername: input.participantUsername,
    },
  });

  await prisma.directMessage.create({
    data: {
      conversationId: conversation.id,
      direction: input.direction,
      content: input.content,
      externalMessageId: input.externalMessageId,
      createdAt: timestamp,
    },
  });

  return true;
}
