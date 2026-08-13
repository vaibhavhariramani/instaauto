import { Router } from 'express';
import { analyticsQuerySchema } from '@instaauto/shared';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import * as analyticsController from '../controllers/analytics.controller';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

analyticsRouter.get('/dashboard', asyncHandler(analyticsController.dashboard));
analyticsRouter.get('/', validateRequest({ query: analyticsQuerySchema }), asyncHandler(analyticsController.analytics));
