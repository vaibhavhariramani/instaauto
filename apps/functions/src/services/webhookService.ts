import { WebhookSource, MessageDirection } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { verifyMetaSignature } from '../lib/crypto';
import { config } from '../config/env';
import { logger } from '../lib/logger';
import { processCommentEvent } from './automationEngine';
import { processMessagingEvent } from './conversationService';
import { decryptAccountToken } from './instagramConnectService';
import { ApiError } from '../middleware/errors';

interface MetaCommentChange {
  field: string;
  value: {
    id: string;
    text?: string;
    from?: { id: string; username?: string };
    media?: { id: string; media_product_type?: string };
  };
}

interface MetaMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: { mid: string; text?: string; is_echo?: boolean };
}

interface MetaWebhookEntry {
  id: string; // Instagram-scoped business account id
  time: number;
  changes?: MetaCommentChange[];
  messaging?: MetaMessagingEvent[];
}

interface MetaWebhookPayload {
  object: string;
  entry: MetaWebhookEntry[];
}

export function verifyWebhookSubscription(mode: string | undefined, token: string | undefined): boolean {
  return mode === 'subscribe' && Boolean(config.META_VERIFY_TOKEN) && token === config.META_VERIFY_TOKEN;
}

export function verifySignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!config.META_APP_SECRET) return config.INSTAGRAM_MOCK_MODE; // allow through in mock/demo mode
  return verifyMetaSignature(rawBody, signatureHeader, config.META_APP_SECRET);
}

export async function handleIncomingWebhook(rawBody: Buffer, signatureHeader: string | undefined): Promise<void> {
  const signatureValid = verifySignature(rawBody, signatureHeader);

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    throw ApiError.badRequest('Malformed webhook payload');
  }

  const log = await prisma.webhookLog.create({
    data: {
      source: WebhookSource.META,
      eventType: payload.object ?? 'unknown',
      payload: payload as unknown as object,
      signatureValid,
    },
  });

  if (!signatureValid) {
    logger.warn({ logId: log.id }, 'Rejected webhook with invalid signature');
    await prisma.webhookLog.update({ where: { id: log.id }, data: { error: 'Invalid signature' } });
    return;
  }

  try {
    for (const entry of payload.entry ?? []) {
      const account = await prisma.instagramAccount.findUnique({
        where: { instagramBusinessId: entry.id },
      });
      if (!account) continue;

      for (const change of entry.changes ?? []) {
        if (change.field !== 'comments') continue;
        const { value } = change;
        if (!value.from || !value.media) continue;

        await processCommentEvent({
          instagramAccountId: account.id,
          reelId: value.media.id,
          instagramCommentId: value.id,
          commenterIgUserId: value.from.id,
          commenterUsername: value.from.username ?? 'unknown',
          text: value.text ?? '',
        });
      }

      for (const event of entry.messaging ?? []) {
        // Skip read/delivery receipts and anything without actual message content.
        if (!event.message?.text) continue;

        const isEcho = event.message.is_echo === true;
        const otherPartyIgUserId = isEcho ? event.recipient.id : event.sender.id;

        const token = decryptAccountToken(account);
        await processMessagingEvent({
          instagramAccountId: account.id,
          otherPartyIgUserId,
          direction: isEcho ? MessageDirection.OUTBOUND : MessageDirection.INBOUND,
          content: event.message.text,
          externalMessageId: event.message.mid,
          timestamp: new Date(event.timestamp),
          accessToken: token,
        });
      }
    }
    await prisma.webhookLog.update({ where: { id: log.id }, data: { processed: true } });
  } catch (err) {
    logger.error({ err, logId: log.id }, 'Failed processing webhook payload');
    await prisma.webhookLog.update({
      where: { id: log.id },
      data: { error: (err as Error).message },
    });
  }
}
