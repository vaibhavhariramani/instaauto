import type { NextFunction, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ApiError } from './errors';
import type { AuthedRequest } from './auth';

/**
 * Must run after requireAuth. Deliberately re-reads isAdmin from the database on every single
 * request instead of trusting anything in the access token or a cached value - access tokens
 * carry no role claim at all (see lib/jwt.ts), specifically so a role change, a revocation, or an
 * admin being demoted takes effect on the very next request rather than waiting up to 15 minutes
 * (or indefinitely, for a stale cache) for the old token to expire.
 */
export async function requireAdmin(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) {
    throw ApiError.forbidden('Admin access required');
  }
  next();
}
