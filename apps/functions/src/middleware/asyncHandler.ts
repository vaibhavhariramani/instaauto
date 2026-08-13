import type { NextFunction, Request, Response } from 'express';

type Handler<Req extends Request = Request> = (
  req: Req,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

/** Wraps an async route handler so rejected promises reach Express's error middleware. */
export function asyncHandler<Req extends Request = Request>(handler: Handler<Req>) {
  return (req: Req, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}
