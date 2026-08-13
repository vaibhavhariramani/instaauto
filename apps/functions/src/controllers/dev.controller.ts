import type { Response } from 'express';
import type { SimulateCommentInput } from '@instaauto/shared';
import { prisma } from '../lib/prisma';
import { processCommentEvent } from '../services/automationEngine';
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
