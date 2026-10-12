import { InstagramAccountStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/errors';
import { instagramService } from './instagramService';
import { decryptAccountToken } from './instagramConnectService';

/** Carousel and single-image/video feed posts - everything getMedia returns except Reels. */
export async function listPostsForAccount(userId: string, instagramAccountId: string) {
  const account = await prisma.instagramAccount.findFirst({
    where: { id: instagramAccountId, userId, status: InstagramAccountStatus.CONNECTED },
  });
  if (!account) throw ApiError.notFound('Connected Instagram account not found');

  const token = decryptAccountToken(account);
  const media = await instagramService.getMedia(account.instagramBusinessId, token);
  return media
    .filter((m) => m.mediaType === 'CAROUSEL' || m.mediaType === 'POST')
    .map(({ mediaType, ...m }) => ({ ...m, postType: mediaType as 'CAROUSEL' | 'POST' }));
}
