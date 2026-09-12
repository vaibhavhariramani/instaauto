import type { Response } from 'express';
import { MessageDirection } from '@prisma/client';
import type { SimulateCommentInput, SimulateInboundDmInput } from '@instaauto/shared';
import { prisma } from '../lib/prisma';
import { processCommentEvent } from '../services/automationEngine';
import { processMessagingEvent } from '../services/conversationService';
import { decryptAccountToken } from '../services/instagramConnectService';
import { ApiError } from '../middleware/errors';
import type { AuthedRequest } from '../middleware/auth';

/** Dev-only endpoint (mock mode) that fires a synthetic comment through the real pipeline. */
export async function simulateComment(req: AuthedRequest, res: Response): Promise<void> {
  const { automationId, commenterUsername, commentText } = req.body as SimulateCommentInput;

  const automation = await prisma.automation.findFirst({
    where: { id: automationId, userId: req.userId },
  });
  if (!automation) throw ApiError.notFound('Automation not found');

  const fakeCommentId = `mock-comment-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const fakeUserId = `mock-user-${commenterUsername}-${Date.now()}`;

  await processCommentEvent({
    instagramAccountId: automation.instagramAccountId,
    reelId: automation.reelId,
    instagramCommentId: fakeCommentId,
    commenterIgUserId: fakeUserId,
    commenterUsername,
    text: commentText,
  });

  res.status(202).json({ status: 'processed' });
}

/** Dev-only endpoint (mock mode) that fires a synthetic inbound DM through the real inbox/AI-reply pipeline. */
export async function simulateInboundDm(req: AuthedRequest, res: Response): Promise<void> {
  const { instagramAccountId, senderUsername, messageText } = req.body as SimulateInboundDmInput;

  const account = await prisma.instagramAccount.findFirst({
    where: { id: instagramAccountId, userId: req.userId },
  });
  if (!account) throw ApiError.notFound('Instagram account not found');

  const fakeUserId = `mock-user-${senderUsername}-${Date.now()}`;
  const token = decryptAccountToken(account);

  await processMessagingEvent({
    instagramAccountId: account.id,
    otherPartyIgUserId: fakeUserId,
    direction: MessageDirection.INBOUND,
    content: messageText,
    externalMessageId: `mock-dm-in-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    timestamp: new Date(),
    accessToken: token,
  });

  res.status(202).json({ status: 'processed' });
}
