import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/app.config';
import { CustomError, ErrorCode } from '../types/error.types';
import usersModel from '../models/users.model';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        walletAddress: string;
        displayName: string;
        userId: string;
      };
    }
  }
}

export interface UserJwtPayload {
  walletAddress: string;
  displayName: string;
  userId: string;
  iat: number;
  exp: number;
}

const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: CustomError = new Error('No Bearer token provided');
      error.status = 403;
      error.errorCode = ErrorCode.UNAUTHORIZED;
      error.color = 'yellow';
      return next(error);
    }

    const token = authHeader.split(' ')[1];
    const secret = config.jwt.secret;

    if (!secret) {
      const error: CustomError = new Error('JWT secret not configured');
      error.status = 500;
      error.errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
      error.color = 'red';
      return next(error);
    }

    try {
      const decodedData = jwt.verify(token, secret) as UserJwtPayload;
      
      // Verify user exists in database
      const user = await usersModel.findByWallet(decodedData.walletAddress);
      if (!user) {
        const error: CustomError = new Error('User not found');
        error.status = 401;
        error.errorCode = ErrorCode.UNAUTHORIZED;
        error.color = 'red';
        return next(error);
      }

      // Attach user data to request
      req.user = {
        walletAddress: user.walletAddress,
        displayName: user.displayName,
        userId: user._id.toString(),
      };

      next();
    } catch (jwtError) {
      const error: CustomError = new Error('Invalid or expired token');
      error.status = 403;
      error.errorCode = ErrorCode.UNAUTHORIZED;
      error.color = 'red';
      error.details = jwtError instanceof Error ? jwtError.message : undefined;
      return next(error);
    }
  } catch (error) {
    const customError: CustomError = new Error('Authentication failed');
    customError.status = 500;
    customError.errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
    customError.color = 'red';
    customError.details = error instanceof Error ? error.message : undefined;
    return next(customError);
  }
};

export default verifyToken;
