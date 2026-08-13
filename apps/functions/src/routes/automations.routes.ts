import { Router } from 'express';
import { automationSchema, updateAutomationSchema } from '@instaauto/shared';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import * as automationsController from '../controllers/automations.controller';

export const automationsRouter = Router();
automationsRouter.use(requireAuth);

automationsRouter.get('/', asyncHandler(automationsController.list));
automationsRouter.get('/:id', asyncHandler(automationsController.getOne));
automationsRouter.post('/', validateRequest({ body: automationSchema }), asyncHandler(automationsController.create));
automationsRouter.put(
  '/:id',
  validateRequest({ body: updateAutomationSchema }),
  asyncHandler(automationsController.update),
);
automationsRouter.delete('/:id', asyncHandler(automationsController.remove));
