import type { Response } from 'express';

export type ApiSuccessBody<T = unknown> = {
  success: true;
  data: T;
};

export type ApiErrorBody = {
  success: false;
  error: {
    message: string;
    code?: string;
  };
};

export class HttpError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export const sendSuccess = <T>(res: Response, data: T, status = 200) : void => {
  const body: ApiSuccessBody<T> = { success: true, data };
  res.status(status).json(body);
}

export const sendFailure = (res: Response, status: number, message: string, code?: string) : void => {
  const body: ApiErrorBody = {
    success: false,
    error: { message, ...(code ? { code } : {}) },
  };
  res.status(status).json(body);
}
