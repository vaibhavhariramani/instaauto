import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from './errors';
import { logger } from '../lib/logger';
import { isProduction } from '../config/env';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { message: `No route for ${req.method} ${req.path}`, code: 'NOT_FOUND' } });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      fields[issue.path.join('.') || 'root'] = issue.message;
    }
    res.status(400).json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields } });
    return;
  }

  if (err instanceof ApiError) {
    if (err.statusCode >= 500) logger.error({ err }, err.message);
    res
      .status(err.statusCode)
      .json({ error: { message: err.message, code: err.code, fields: err.fields } });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: {
      message: isProduction ? 'Internal server error' : (err as Error)?.message ?? 'Unknown error',
      code: 'INTERNAL',
    },
  });
}
