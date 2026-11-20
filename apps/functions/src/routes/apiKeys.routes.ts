import { Router } from 'express';
import { createApiKeySchema } from '@instaauto/shared';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import * as apiKeysController from '../controllers/apiKeys.controller';

export const apiKeysRouter = Router();
apiKeysRouter.use(requireAuth);

apiKeysRouter.get('/', asyncHandler(apiKeysController.list));
apiKeysRouter.post(
  '/',
  validateRequest({ body: createApiKeySchema }),
  asyncHandler(apiKeysController.create),
);
apiKeysRouter.delete('/:id', asyncHandler(apiKeysController.revoke));
