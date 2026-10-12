import { Router } from 'express';
import { adminUpdateUserPlanSchema, adminUserListQuerySchema } from '@instaauto/shared';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import * as adminController from '../controllers/admin.controller';

export const adminRouter = Router();

// Deny-by-default: every route below requires both a valid session AND a live, DB-verified
// isAdmin=true on that session's user. Neither check is ever skipped or short-circuited by a
// query param, header, or anything else client-supplied.
adminRouter.use(requireAuth);
adminRouter.use(asyncHandler(requireAdmin));

adminRouter.get('/dashboard', asyncHandler(adminController.dashboard));
adminRouter.get(
  '/users',
  validateRequest({ query: adminUserListQuerySchema }),
  asyncHandler(adminController.listUsers),
);
adminRouter.get('/users/:id', asyncHandler(adminController.getUser));
adminRouter.patch(
  '/users/:id/plan',
  validateRequest({ body: adminUpdateUserPlanSchema }),
  asyncHandler(adminController.updateUserPlan),
);
