import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';

export interface UserPayload {
  userId: string;
  role: 'OPERATOR' | 'ADMIN' | 'AUDITOR';
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For the sake of the assessment, if no token is provided, we can either reject
    // or for ease of testing, mock an OPERATOR user. Let's strictly reject if we want secure APIs,
    // but allow a fallback for easy testing if needed. We will be strict here.
    return next(new AppError('Missing or invalid authorization header', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401, 'UNAUTHORIZED'));
  }
};

export const requireRole = (roles: Array<'OPERATOR' | 'ADMIN' | 'AUDITOR'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401, 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }

    next();
  };
};
