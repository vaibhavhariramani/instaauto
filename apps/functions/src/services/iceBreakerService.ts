import type { IceBreakerInput, UpdateIceBreakerInput } from '@instaauto/shared';
import { InstagramAccountStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/errors';
import { instagramService } from './instagramService';
import { decryptAccountToken } from './instagramConnectService';
import { logger } from '../lib/logger';

const MAX_ICE_BREAKERS = 4;

async function requireOwnedAccount(userId: string, instagramAccountId: string) {
  const account = await prisma.instagramAccount.findFirst({
    where: { id: instagramAccountId, userId },
  });
  if (!account) throw ApiError.notFound('Instagram account not found');
  return account;
}

/**
 * Pushes the account's current Ice Breakers to Instagram. Best-effort — a Meta API failure here
 * (e.g. the messenger_profile endpoint rejecting a direct-Instagram-Login token) must not block
 * saving the Ice Breaker locally, since the underlying Meta endpoint shape isn't verified for
 * this app's Instagram Login flow.
 */
async function syncToInstagram(instagramAccountId: string): Promise<void> {
  try {
    const account = await prisma.instagramAccount.findUnique({ where: { id: instagramAccountId } });
    if (!account || account.status !== InstagramAccountStatus.CONNECTED) return;

    const iceBreakers = await prisma.iceBreaker.findMany({
      where: { instagramAccountId },
      orderBy: { position: 'asc' },
    });
    const token = decryptAccountToken(account);
    await instagramService.syncIceBreakers(
      account.instagramBusinessId,
      token,
      iceBreakers.map((ib) => ({ question: ib.question, payload: ib.id })),
    );
  } catch (err) {
    logger.warn(
      { err: (err as Error).message, instagramAccountId },
      'Ice breaker sync to Instagram failed',
    );
  }
}

export async function listIceBreakers(userId: string, instagramAccountId: string) {
  await requireOwnedAccount(userId, instagramAccountId);
  return prisma.iceBreaker.findMany({
    where: { instagramAccountId },
    orderBy: { position: 'asc' },
  });
}

export async function createIceBreaker(userId: string, input: IceBreakerInput) {
  await requireOwnedAccount(userId, input.instagramAccountId);

  const count = await prisma.iceBreaker.count({
    where: { instagramAccountId: input.instagramAccountId },
  });
  if (count >= MAX_ICE_BREAKERS) {
    throw ApiError.badRequest(`You can only have up to ${MAX_ICE_BREAKERS} ice breakers`);
  }

  const iceBreaker = await prisma.iceBreaker.create({
    data: {
      instagramAccountId: input.instagramAccountId,
      question: input.question,
      response: input.response,
      position: count,
    },
  });

  await syncToInstagram(input.instagramAccountId);
  return iceBreaker;
}

async function getOwnedIceBreaker(userId: string, id: string) {
  const iceBreaker = await prisma.iceBreaker.findUnique({
    where: { id },
    include: { instagramAccount: true },
  });
  if (!iceBreaker || iceBreaker.instagramAccount.userId !== userId)
    throw ApiError.notFound('Ice breaker not found');
  return iceBreaker;
}

export async function updateIceBreaker(userId: string, id: string, input: UpdateIceBreakerInput) {
  const existing = await getOwnedIceBreaker(userId, id);
  const iceBreaker = await prisma.iceBreaker.update({
    where: { id },
    data: { question: input.question, response: input.response },
  });
  await syncToInstagram(existing.instagramAccountId);
  return iceBreaker;
}

export async function deleteIceBreaker(userId: string, id: string): Promise<void> {
  const existing = await getOwnedIceBreaker(userId, id);
  await prisma.iceBreaker.delete({ where: { id } });
  await syncToInstagram(existing.instagramAccountId);
}
