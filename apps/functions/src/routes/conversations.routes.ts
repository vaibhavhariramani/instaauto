import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as conversationsController from '../controllers/conversations.controller';

export const conversationsRouter = Router();
conversationsRouter.use(requireAuth);

conversationsRouter.get('/:accountId', asyncHandler(conversationsController.list));
conversationsRouter.get('/:accountId/:conversationId', asyncHandler(conversationsController.messages));
