import { Router, type NextFunction, type Request, type Response } from 'express';
import { simulateCommentSchema, simulateInboundDmSchema } from '@instaauto/shared';
import { config } from '../config/env';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import * as devController from '../controllers/dev.controller';

export const devRouter = Router();
devRouter.use(requireAuth);

function mockModeOnly(_req: Request, res: Response, next: NextFunction) {
  if (!config.INSTAGRAM_MOCK_MODE) {
    res.status(404).json({ error: { message: 'Not found' } });
    return;
  }
  next();
}

devRouter.post(
  '/simulate-comment',
  mockModeOnly,
  validateRequest({ body: simulateCommentSchema }),
  asyncHandler(devController.simulateComment),
);

devRouter.post(
  '/simulate-inbound-dm',
  mockModeOnly,
  validateRequest({ body: simulateInboundDmSchema }),
  asyncHandler(devController.simulateInboundDm),
);
