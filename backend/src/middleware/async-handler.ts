/**
 * Async error handler wrapper for Express routes
 * Catches errors from async route handlers and forwards them to Express error middleware
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler to catch errors and forward them to next()
 * @param fn - Async route handler function
 * @returns Wrapped handler that catches errors
 */
export const asyncHandler = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
