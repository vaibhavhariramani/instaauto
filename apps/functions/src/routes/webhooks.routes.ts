import { Router, raw } from 'express';
import { webhookRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/asyncHandler';
import * as webhooksController from '../controllers/webhooks.controller';

export const webhooksRouter = Router();

webhooksRouter.get('/instagram', webhooksController.verifyInstagramWebhook);
webhooksRouter.post(
  '/instagram',
  webhookRateLimiter,
  raw({ type: '*/*', limit: '2mb' }),
  asyncHandler(webhooksController.receiveInstagramWebhook),
);

webhooksRouter.post(
  '/stripe',
  webhookRateLimiter,
  raw({ type: 'application/json', limit: '2mb' }),
  asyncHandler(webhooksController.receiveStripeWebhook),
);
