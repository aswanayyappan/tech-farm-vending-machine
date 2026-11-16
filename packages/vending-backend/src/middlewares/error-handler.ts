/**
 * Centralized Application Error Handling Middleware
 * Converts AppError instances into clean, formatted JSON HTTP responses.
 * Satisfies Rule 4 (Robust Error Handling) and Rule 8 (Information Leak Prevention).
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@sdds/shared';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      timestamp: err.timestamp,
    });
    return;
  }

  // Catch unexpected unhandled exceptions (do not expose internal stack traces to public kiosk client)
  console.error('[UNHANDLED_EXCEPTION]', err);
  res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected system error occurred.',
    timestamp: Date.now(),
  });
}

