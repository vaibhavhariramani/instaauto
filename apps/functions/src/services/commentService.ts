import { InstagramAccountStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/errors';
import { instagramService } from './instagramService';
import { decryptAccountToken } from './instagramConnectService';
import type { SendReplyResult } from '../types/instagram';

async function requireConnectedAccount(userId: string, instagramAccountId: string) {
  const account = await prisma.instagramAccount.findFirst({
    where: { id: instagramAccountId, userId, status: InstagramAccountStatus.CONNECTED },
  });
  if (!account) throw ApiError.notFound('Connected Instagram account not found');
  return account;
}

export async function listRecentCommentsForAccount(userId: string, instagramAccountId: string) {
  const account = await requireConnectedAccount(userId, instagramAccountId);
  const token = decryptAccountToken(account);
  return instagramService.getRecentComments(account.instagramBusinessId, token, 20);
}

export async function replyToCommentForAccount(
  userId: string,
  instagramAccountId: string,
  commentId: string,
  message: string,
): Promise<SendReplyResult> {
  const account = await requireConnectedAccount(userId, instagramAccountId);
  const token = decryptAccountToken(account);
  return instagramService.replyToComment(commentId, message, token);
}
