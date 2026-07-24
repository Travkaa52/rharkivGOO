import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger.js';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }

  logger.error({ err }, 'Необроблена помилка запиту');
  return res.status(500).json({ message: 'Внутрішня помилка сервера' });
}
