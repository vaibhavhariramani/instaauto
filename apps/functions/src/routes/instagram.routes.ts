import { Router } from 'express';
import { instagramOAuthCallbackSchema, replyToCommentSchema } from '@instaauto/shared';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import * as instagramController from '../controllers/instagram.controller';

export const instagramRouter = Router();

instagramRouter.get(
  '/oauth/callback',
  validateRequest({ query: instagramOAuthCallbackSchema }),
  asyncHandler(instagramController.oauthCallback),
);

instagramRouter.use(requireAuth);
instagramRouter.get('/', asyncHandler(instagramController.listAccounts));
instagramRouter.post('/connect', asyncHandler(instagramController.connect));
instagramRouter.post('/:id/disconnect', asyncHandler(instagramController.disconnect));
instagramRouter.get('/:id/reels', asyncHandler(instagramController.reels));
instagramRouter.get('/:id/comments', asyncHandler(instagramController.recentComments));
instagramRouter.post(
  '/:id/comments/:commentId/reply',
  validateRequest({ body: replyToCommentSchema }),
  asyncHandler(instagramController.replyToComment),
);
