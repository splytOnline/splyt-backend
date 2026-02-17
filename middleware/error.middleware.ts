import { Request, Response, NextFunction } from 'express';
import { CustomError, ErrorResponse, ErrorCode } from '../types/error.types';

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default values
  const statusCode = err.status || 500;
  const errorCode = err.errorCode || ErrorCode.INTERNAL_SERVER_ERROR;
  const message = err.message || 'An unexpected error occurred';
  const details = err.details || null;
  const color = err.color || 'red';

  // Log error for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${errorCode}: ${message}`);
    console.error(err.stack);
  }

  // Send error response
  const errorResponse: ErrorResponse = {
    success: false,
    status: statusCode,
    errorCode,
    message,
    details,
    color,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
  