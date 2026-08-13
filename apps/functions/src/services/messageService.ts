import type { MessagesQuery } from '@instaauto/shared';
import { MessageStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/errors';
import { retryDueMessages } from './dmService';
import { instagramService } from './instagramService';
import { decryptAccountToken } from './instagramConnectService';

export async function listMessages(userId: string, query: MessagesQuery) {
  const where = {
    userId,
    ...(query.status !== 'ALL' ? { status: query.status as MessageStatus } : {}),
    ...(query.automationId ? { automationId: query.automationId } : {}),
    ...(query.search
      ? { recipientUsername: { contains: query.search, mode: 'insensitive' as const } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: { automation: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.message.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) };
}

export async function retryMessage(userId: string, id: string): Promise<void> {
  const message = await prisma.message.findFirst({
    where: { id, userId },
    include: { comment: true, instagramAccount: true },
  });
  if (!message) throw ApiError.notFound('Message not found');
  if (!message.comment) throw ApiError.badRequest('This message has no associated comment to retry against');
  if (message.status !== 'FAILED' && message.status !== 'RETRYING') {
    throw ApiError.badRequest('Only failed messages can be retried');
  }

  await prisma.message.update({ where: { id }, data: { status: MessageStatus.RETRYING, nextRetryAt: new Date() } });

  try {
    const token = decryptAccountToken(message.instagramAccount);
    await instagramService.sendPrivateReply(message.comment.instagramCommentId, message.content, token);
    await prisma.message.update({
      where: { id },
      data: { status: MessageStatus.SENT, sentAt: new Date(), deliveredAt: new Date() },
    });
  } catch (err) {
    await prisma.message.update({
      where: { id },
      data: { status: MessageStatus.FAILED, errorMessage: (err as Error).message, retryCount: { increment: 1 } },
    });
    throw ApiError.badRequest(`Retry failed: ${(err as Error).message}`);
  }
}

export { retryDueMessages };
