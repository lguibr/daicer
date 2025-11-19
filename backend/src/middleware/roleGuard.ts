/**
 * Role-based authorization middleware
 */

import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth';
import type { Role } from '@/types/index';
import { ApiError } from './error';
import { logger } from '@/utils/logger';

/**
 * Create middleware that requires user to have one of the specified roles
 * @param allowedRoles - Array of roles that can access the route
 * @returns Middleware function
 */
export function requireRole(allowedRoles: Role[]): (req: AuthRequest, res: Response, next: NextFunction) => void {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, 'Authentication required'));
      return;
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      logger.warn(`Access denied for user ${req.user.uid} with role ${userRole}. Required: ${allowedRoles.join(', ')}`);
      next(new ApiError(403, `Access denied. Required role: ${allowedRoles.join(' or ')}`));
      return;
    }

    next();
  };
}

/**
 * Middleware that requires premium or god role
 */
export const requirePremium = requireRole(['premium', 'god']);

/**
 * Middleware that requires god role
 */
export const requireGod = requireRole(['god']);
