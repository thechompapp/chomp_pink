/**
 * Error Handler Utility
 * 
 * Provides standardized error types and handling throughout the application
 */
import { logError } from './logger.js';

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, data = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.data = data;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...(this.data && { data: this.data })
    };
  }
}

/**
 * Client errors (400-499)
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request', data = null) {
    super(message, 400, data);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', data = null) {
    super(message, 401, data);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', data = null) {
    super(message, 403, data);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', data = null) {
    super(message, 404, data);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', data = null) {
    super(message, 409, data);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation error', data = null) {
    super(message, 422, data);
  }
}

/**
 * Server errors (500-599)
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', data = null) {
    super(message, 500, data);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database error', data = null) {
    super(message, 500, data);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable', data = null) {
    super(message, 503, data);
  }
}

/**
 * Specific application errors
 */
export class ResourceNotFoundError extends NotFoundError {
  constructor(resourceType, identifier, additionalInfo = null) {
    const message = `${resourceType} with identifier ${identifier} not found`;
    super(message, { resourceType, identifier, additionalInfo });
  }
}

export class DatabaseQueryError extends DatabaseError {
  constructor(queryInfo, originalError = null) {
    const message = originalError?.message || 'Database query failed';
    super(message, { 
      query: process.env.NODE_ENV !== 'production' ? queryInfo : undefined,
      code: originalError?.code 
    });
  }
}

export class AuthenticationError extends UnauthorizedError {
  constructor(reason = 'Invalid credentials', additionalInfo = null) {
    super(`Authentication failed: ${reason}`, additionalInfo);
  }
}

/**
 * Central error handler middleware for Express
 */
export function errorHandlerMiddleware(err, req, res, next) {
  // Log the error
  logError(`[ErrorHandler] ${err.message}`, err);
  
  // Determine the status code
  const statusCode = err.statusCode || 500;
  
  // Determine the response format
  const response = {
    success: false,
    message: statusCode < 500 ? err.message : 'An unexpected error occurred',
    error: {
      type: err.name || 'Error',
      ...(process.env.NODE_ENV !== 'production' && statusCode >= 500 && { stack: err.stack })
    },
    ...(err.data && { data: err.data })
  };
  
  // Send the response
  res.status(statusCode).json(response);
}

/**
 * Helper to convert any error to an AppError
 */
export function normalizeError(err) {
  if (err instanceof AppError) {
    return err;
  }
  
  // Convert common error types
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return new ServiceUnavailableError('Database connection failed', { 
      originalMessage: err.message,
      code: err.code
    });
  }
  
  if (err.code === '23505') { // PostgreSQL unique constraint violation
    return new ConflictError('Duplicate entry', {
      originalMessage: err.message,
      detail: err.detail
    });
  }
  
  if (err.code === '22P02') { // PostgreSQL invalid text representation
    return new BadRequestError('Invalid input value', {
      originalMessage: err.message,
      detail: err.detail
    });
  }
  
  // Default to internal server error
  return new InternalServerError(err.message || 'An unexpected error occurred');
}

// Export all errors as part of a namespace
export const Errors = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  DatabaseError,
  ServiceUnavailableError,
  ResourceNotFoundError,
  DatabaseQueryError,
  AuthenticationError,
  normalizeError
};

export default Errors; 