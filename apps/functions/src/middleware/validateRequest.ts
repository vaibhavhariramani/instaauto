import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

interface ValidationTargets {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/** Parses/validates req.body, req.query, req.params in place, replacing them with parsed data. */
export function validateRequest({ body, query, params }: ValidationTargets) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (body) req.body = body.parse(req.body);
    if (query) req.query = query.parse(req.query) as unknown as Request['query'];
    if (params) req.params = params.parse(req.params) as unknown as Request['params'];
    next();
  };
}
