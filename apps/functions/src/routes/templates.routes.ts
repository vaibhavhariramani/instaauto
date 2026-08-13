import { Router } from 'express';
import { templateSchema, updateTemplateSchema } from '@instaauto/shared';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import * as templatesController from '../controllers/templates.controller';

export const templatesRouter = Router();
templatesRouter.use(requireAuth);

templatesRouter.get('/', asyncHandler(templatesController.list));
templatesRouter.post('/', validateRequest({ body: templateSchema }), asyncHandler(templatesController.create));
templatesRouter.put(
  '/:id',
  validateRequest({ body: updateTemplateSchema }),
  asyncHandler(templatesController.update),
);
templatesRouter.delete('/:id', asyncHandler(templatesController.remove));
templatesRouter.post('/:id/favorite', asyncHandler(templatesController.favorite));
templatesRouter.post('/:id/duplicate', asyncHandler(templatesController.duplicate));
