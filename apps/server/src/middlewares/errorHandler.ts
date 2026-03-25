import type { NextFunction, Request, Response } from 'express';
import { HttpError, sendFailure } from '@/utils/apiResponse';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof HttpError) {
    sendFailure(res, err.status, err.message, err.code);
    return;
  }

  console.error('[errorHandler]', err);
  sendFailure(res, 500, 'Internal server error', 'INTERNAL_ERROR');
}
