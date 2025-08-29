import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '@/utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.details = details;
  }
}

export class AuthenticationError extends Error {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';

  constructor(message: string = 'Authentication required') {
    super(message);
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';

  constructor(message: string = 'Insufficient permissions') {
    super(message);
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(message: string = 'Resource not found') {
    super(message);
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  code = 'CONFLICT';

  constructor(message: string = 'Resource conflict') {
    super(message);
  }
}

export class TenantError extends Error {
  statusCode = 403;
  code = 'TENANT_ERROR';

  constructor(message: string = 'Tenant access denied') {
    super(message);
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error with request context
  logger.error({
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
    },
    requestId: req.headers['x-request-id'],
  }, 'Request error');

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
      },
    });
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          error: {
            code: 'UNIQUE_CONSTRAINT_VIOLATION',
            message: 'A record with this value already exists',
            details: {
              field: err.meta?.target,
            },
          },
        });
      case 'P2025':
        return res.status(404).json({
          error: {
            code: 'RECORD_NOT_FOUND',
            message: 'The requested record was not found',
          },
        });
      case 'P2003':
        return res.status(400).json({
          error: {
            code: 'FOREIGN_KEY_CONSTRAINT',
            message: 'Invalid reference to related record',
          },
        });
      default:
        return res.status(500).json({
          error: {
            code: 'DATABASE_ERROR',
            message: 'A database error occurred',
          },
        });
    }
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      error: {
        code: 'DATABASE_VALIDATION_ERROR',
        message: 'Invalid data provided',
      },
    });
  }

  // Handle known application errors
  if (err.statusCode && err.code) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
      },
    });
  }

  // Handle multer errors (file upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds the maximum allowed limit',
        },
      });
    }
    return res.status(400).json({
      error: {
        code: 'FILE_UPLOAD_ERROR',
        message: 'File upload failed',
      },
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDevelopment ? err.message : 'An unexpected error occurred',
      ...(isDevelopment && { stack: err.stack }),
    },
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
