import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as notificationsController from '../controllers/notifications.controller';

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get('/', asyncHandler(notificationsController.list));
notificationsRouter.post('/:id/read', asyncHandler(notificationsController.markRead));
notificationsRouter.post('/read-all', asyncHandler(notificationsController.markAllRead));
