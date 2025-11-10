/**
 * Authentication middleware using Firebase Auth
 */

import type { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '@/config/firebase';
import { ApiError } from './error.js';

/**
 * Extended request with authenticated user
 */
export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    name: string;
  };
}

/**
 * Verify Firebase ID token and attach user to request
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No authentication token provided');
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || '',
    };

    next();
  } catch (error) {
    next(new ApiError(401, 'Invalid authentication token'));
  }
}
