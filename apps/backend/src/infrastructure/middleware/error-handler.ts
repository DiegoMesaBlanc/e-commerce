import { type NextFunction, type Request, type Response } from 'express';
import { AppError } from '../../application/errors';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Route "${req.method} ${req.originalUrl}" was not found.` });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'Internal server error.' });
}