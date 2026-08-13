import { Router } from 'express';
import { emailLoginSchema, emailRegisterSchema, googleLoginSchema } from '@instaauto/shared';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import { authRateLimiter } from '../middleware/rateLimiter';
import * as authController from '../controllers/auth.controller';

export const authRouter = Router();

authRouter.post(
  '/google',
  authRateLimiter,
  validateRequest({ body: googleLoginSchema }),
  asyncHandler(authController.googleLogin),
);
authRouter.post(
  '/register',
  authRateLimiter,
  validateRequest({ body: emailRegisterSchema }),
  asyncHandler(authController.emailRegister),
);
authRouter.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: emailLoginSchema }),
  asyncHandler(authController.emailLogin),
);
authRouter.post('/refresh', authRateLimiter, asyncHandler(authController.refresh));
authRouter.post('/logout', asyncHandler(authController.logout));
