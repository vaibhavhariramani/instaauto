import { Router } from 'express';
import { createCheckoutSessionSchema } from '@instaauto/shared';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import * as billingController from '../controllers/billing.controller';

export const billingRouter = Router();
billingRouter.use(requireAuth);

billingRouter.get('/plans', asyncHandler(billingController.plans));
billingRouter.post(
  '/checkout',
  validateRequest({ body: createCheckoutSessionSchema }),
  asyncHandler(billingController.checkout),
);
billingRouter.post('/portal', asyncHandler(billingController.portal));
billingRouter.get('/invoices', asyncHandler(billingController.invoices));
