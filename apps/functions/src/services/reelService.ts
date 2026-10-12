import { InstagramAccountStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/errors';
import { instagramService } from './instagramService';
import { decryptAccountToken } from './instagramConnectService';

export async function listReelsForAccount(userId: string, instagramAccountId: string) {
  const account = await prisma.instagramAccount.findFirst({
    where: { id: instagramAccountId, userId, status: InstagramAccountStatus.CONNECTED },
  });
  if (!account) throw ApiError.notFound('Connected Instagram account not found');

  const token = decryptAccountToken(account);
  const media = await instagramService.getMedia(account.instagramBusinessId, token);
  return media.filter((m) => m.mediaType === 'REEL');
}
