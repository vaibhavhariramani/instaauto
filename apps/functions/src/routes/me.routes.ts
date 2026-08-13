import { Router } from 'express';
import { notificationPrefsSchema, updateProfileSchema } from '@instaauto/shared';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import * as meController from '../controllers/me.controller';

export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get('/', asyncHandler(meController.getMe));
meRouter.patch('/', validateRequest({ body: updateProfileSchema }), asyncHandler(meController.updateMe));
meRouter.post('/complete-onboarding', asyncHandler(meController.completeOnboarding));
meRouter.patch(
  '/notifications-prefs',
  validateRequest({ body: notificationPrefsSchema }),
  asyncHandler(meController.updateNotificationPrefs),
);
meRouter.delete('/', asyncHandler(meController.deleteMe));
