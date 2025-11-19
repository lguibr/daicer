/**
 * Socket.IO Middleware for Authentication
 * Validates JWT tokens from Firebase Auth
 */

import type { Socket } from 'socket.io';
import { getFirebaseAuth } from '@/config/firebase';
import { logger } from '@/utils/logger';
import type { SocketData } from './types';

/**
 * Extended error with additional data
 */
interface SocketError extends Error {
  data?: {
    content: string;
    code: string;
  };
}

/**
 * Authentication middleware
 * Verifies Firebase JWT token and attaches userId to socket.data
 */
export async function authMiddleware(socket: Socket, next: (err?: Error) => void): Promise<void> {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      logger.warn('[Socket] Connection attempt without token', {
        socketId: socket.id,
      });
      return next(new Error('Authentication token required'));
    }

    // Verify token with Firebase
    const adminAuth = getFirebaseAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Attach user info to socket data
    (socket.data as SocketData).userId = decodedToken.uid;
    (socket.data as SocketData).username = decodedToken.name;

    logger.info('[Socket] Authenticated', {
      socketId: socket.id,
      userId: decodedToken.uid,
    });

    next();
  } catch (error) {
    logger.error('[Socket] Authentication failed', {
      socketId: socket.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const err: SocketError = new Error('Authentication failed');
    err.data = {
      content: 'Please sign in again',
      code: 'INVALID_TOKEN',
    };
    next(err);
  }
}

/**
 * Rate limiting middleware
 * Prevents abuse by limiting events per socket
 */
export function rateLimitMiddleware(maxEventsPerSecond: number = 100) {
  const limits = new Map<string, { count: number; resetTime: number }>();

  return function rateLimitHandler(socket: Socket, next: (err?: Error) => void): void {
    const now = Date.now();
    const socketId = socket.id;

    let limit = limits.get(socketId);

    if (!limit || now > limit.resetTime) {
      // Reset counter every second
      limit = { count: 0, resetTime: now + 1000 };
      limits.set(socketId, limit);
    }

    limit.count++;

    if (limit.count > maxEventsPerSecond) {
      logger.warn('[Socket] Rate limit exceeded', {
        socketId,
        count: limit.count,
      });

      const err: SocketError = new Error('Rate limit exceeded');
      err.data = {
        content: 'Too many requests',
        code: 'RATE_LIMIT',
      };
      return next(err);
    }

    next();
  };
}

/**
 * Logging middleware
 * Logs all incoming events (development only)
 */
export function loggingMiddleware(socket: Socket, next: (err?: Error) => void): void {
  if (process.env.NODE_ENV === 'development') {
    socket.onAny((event, ...args) => {
      logger.debug('[Socket] Event received', {
        socketId: socket.id,
        event,
        argsCount: args.length,
      });
    });
  }
  next();
}

/**
 * Cleanup on disconnect
 */
export function cleanupMiddleware(socket: Socket): void {
  socket.on('disconnect', (reason) => {
    logger.info('[Socket] Disconnected', {
      socketId: socket.id,
      userId: (socket.data as SocketData).userId,
      reason,
    });
  });
}
