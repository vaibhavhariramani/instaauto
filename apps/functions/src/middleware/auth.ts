import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { ApiError } from './errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
      userEmail: string;
    }
  }
}

/**
 * Alias kept for readability at call sites — `userId`/`userEmail` are merged onto the global
 * Express `Request` type above (rather than a `Request` subtype) so authenticated route
 * handlers stay structurally assignable to Express's plain `RequestHandler` type.
 */
export type AuthedRequest = Request;

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing bearer token');
  }
  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length));
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }
}
