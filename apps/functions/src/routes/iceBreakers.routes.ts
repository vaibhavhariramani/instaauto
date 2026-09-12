import { Router } from 'express';
import { iceBreakerSchema, updateIceBreakerSchema } from '@instaauto/shared';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import * as iceBreakersController from '../controllers/iceBreakers.controller';

export const iceBreakersRouter = Router();
iceBreakersRouter.use(requireAuth);

iceBreakersRouter.get('/:accountId', asyncHandler(iceBreakersController.list));
iceBreakersRouter.post(
  '/',
  validateRequest({ body: iceBreakerSchema }),
  asyncHandler(iceBreakersController.create),
);
iceBreakersRouter.put(
  '/:id',
  validateRequest({ body: updateIceBreakerSchema }),
  asyncHandler(iceBreakersController.update),
);
iceBreakersRouter.delete('/:id', asyncHandler(iceBreakersController.remove));
