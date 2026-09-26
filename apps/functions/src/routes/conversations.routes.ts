import { Router } from 'express';
import { sendMessageSchema } from '@instaauto/shared';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest } from '../middleware/validateRequest';
import * as conversationsController from '../controllers/conversations.controller';

export const conversationsRouter = Router();
conversationsRouter.use(requireAuth);

conversationsRouter.get('/:accountId', asyncHandler(conversationsController.list));
conversationsRouter.get(
  '/:accountId/:conversationId',
  asyncHandler(conversationsController.messages),
);
conversationsRouter.post(
  '/:accountId/:conversationId/messages',
  validateRequest({ body: sendMessageSchema }),
  asyncHandler(conversationsController.send),
);
