import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error(err.message, { stack: err.stack });

  // Default error response
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };

  // Handle known error types
  if (err instanceof AppError) {
    response.error.code = err.code;
    response.error.message = err.message;
    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof ZodError) {
    response.error.code = 'VALIDATION_ERROR';
    response.error.message = 'Validation failed';
    response.error.details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json(response);
    return;
  }

  // Handle Supabase errors
  if ('code' in err && typeof (err as { code: unknown }).code === 'string') {
    const supabaseError = err as { code: string; message: string };
    
    if (supabaseError.code === 'PGRST116') {
      response.error.code = 'NOT_FOUND';
      response.error.message = 'Resource not found';
      res.status(404).json(response);
      return;
    }

    if (supabaseError.code === '23505') {
      response.error.code = 'CONFLICT_ERROR';
      response.error.message = 'Resource already exists';
      res.status(409).json(response);
      return;
    }

    if (supabaseError.code === '23503') {
      response.error.code = 'VALIDATION_ERROR';
      response.error.message = 'Invalid reference';
      res.status(400).json(response);
      return;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    response.error.code = 'AUTHENTICATION_ERROR';
    response.error.message = 'Invalid token';
    res.status(401).json(response);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    response.error.code = 'AUTHENTICATION_ERROR';
    response.error.message = 'Token expired';
    res.status(401).json(response);
    return;
  }

  // Include stack trace in development
  if (config.isDev) {
    response.error.stack = err.stack;
    response.error.message = err.message;
  }

  res.status(500).json(response);
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

// Async handler wrapper to catch errors
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

