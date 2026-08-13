import { Router } from 'express';
import { simulateCommentSchema } from '@instaauto/shared';
import { config } from '../config/env';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import * as devController from '../controllers/dev.controller';

export const devRouter = Router();
devRouter.use(requireAuth);

devRouter.post(
  '/simulate-comment',
  (_req, res, next) => {
    if (!config.INSTAGRAM_MOCK_MODE) {
      res.status(404).json({ error: { message: 'Not found' } });
      return;
    }
    next();
  },
  validateRequest({ body: simulateCommentSchema }),
  asyncHandler(devController.simulateComment),
);
