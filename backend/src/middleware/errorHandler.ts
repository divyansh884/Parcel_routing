import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../observability/logger';
import { z } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.id || 'unknown';

  if (err instanceof z.ZodError) {
    logger.warn({ err, requestId }, 'Validation Error');
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        requestId,
        details: err.issues,
      },
    });
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, err.message);
    } else {
      logger.warn({ err, requestId }, err.message);
    }

    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        requestId,
        details: err.details,
      },
    });
  }

  // Unhandled/Unexpected Errors
  logger.error({ err, requestId }, 'Unexpected Error');

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong while processing the request.',
      requestId,
    },
  });
};
