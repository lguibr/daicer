/**
 * Authentication middleware using Firebase Auth
 */

import type { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '@/config/firebase';
import { logger } from '@/utils/logger';
import { ApiError } from './error.js';

import type { Role } from '@/types/index';

/**
 * Extended request with authenticated user
 */
export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    name: string;
    role: Role;
  };
}

/**
 * Verify Firebase ID token and attach user to request
 * Supports both Authorization header and query parameter (for SSE compatibility)
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  let token: string | undefined;

  // Try Authorization header first (preferred)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const [scheme, ...rest] = authHeader.trim().split(/\s+/);
    if (scheme && scheme.toLowerCase() === 'bearer') {
      token = rest.join(' ').trim();
    }
  }

  // Fallback to query parameter (for EventSource/SSE which can't send custom headers)
  if (!token && typeof req.query.token === 'string') {
    token = req.query.token.trim();
  }

  if (!token) {
    next(new ApiError(401, 'No authentication token provided'));
    return;
  }

  const loweredToken = token.toLowerCase();
  if (loweredToken === 'undefined' || loweredToken === 'null') {
    next(new ApiError(401, 'Invalid authentication token'));
    return;
  }

  try {
    const auth = getFirebaseAuth();

    // In development/test environment with emulator, handle custom/emulator tokens
    // Firebase emulator Auth accepts custom tokens without full verification
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      // For emulator: attempt to verify with emulator (which accepts custom tokens)
      try {
        const decodedToken = await auth.verifyIdToken(token, false); // Don't check revoked in emulator
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          name: decodedToken.name || '',
          role: (decodedToken.role as Role) || 'free',
        };
        next();
        return;
      } catch (emulatorError) {
        // If emulator verification fails, try to extract from custom token format
        // Custom tokens have format: eyJhbGciOi...base64 parts
        const parts = token.split('.');
        if (parts.length === 3 && parts[1]) {
          try {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            if (payload.uid) {
              req.user = {
                uid: payload.uid,
                email: payload.email || `${payload.uid}@test.com`,
                name: payload.name || 'Test User',
                role: (payload.role as Role) || 'free',
              };
              next();
              return;
            }
          } catch {
            // Fall through to error
            logger.error('Failed to decode custom token in emulator mode:', emulatorError);
          }
        }
      }
    }

    // Production verification (only reached if not using emulator or emulator verification failed)
    const decodedToken = await auth.verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || '',
      role: (decodedToken.role as Role) || 'free',
    };

    next();
  } catch (error) {
    logger.error('Auth token verification failed:', error);
    next(new ApiError(401, 'Invalid authentication token'));
  }
}

// Export as authMiddleware for backward compatibility
export { authenticate as authMiddleware };
