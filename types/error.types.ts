/**
 * Custom error interface that extends the base Error type
 * Used for standardized error handling across the application
 */
export interface CustomError extends Error {
    status?: number;
    errorCode?: string;
    details?: any;
    color?: string;
  }
  
  /**
   * Standard error response format
   */
  export interface ErrorResponse {
    success: false;
    status: number;
    errorCode: string;
    message: string;
    details: any | null;
    color: string;
    timestamp: string;
  }
  
  /**
   * Common error codes used throughout the application
   */
  export enum ErrorCode {
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    BAD_REQUEST = 'BAD_REQUEST',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
  }