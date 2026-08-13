import { Router } from 'express';
import { messagesQuerySchema } from '@instaauto/shared';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import * as messagesController from '../controllers/messages.controller';

export const messagesRouter = Router();
messagesRouter.use(requireAuth);

messagesRouter.get('/', validateRequest({ query: messagesQuerySchema }), asyncHandler(messagesController.list));
messagesRouter.post('/:id/retry', asyncHandler(messagesController.retry));
