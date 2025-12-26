/**
 * RequireRole - Conditional rendering guard component
 *
 * Renders children only if user has required role
 *
 * Examples:
 *
 * // Show premium feature only to premium and god users
 * <RequireRole roles={['premium', 'god']}>
 *   <PremiumFeature />
 * </RequireRole>
 *
 * // Show admin panel only to god users
 * <RequireRole roles={['god']}>
 *   <AdminPanel />
 * </RequireRole>
 *
 * // Show fallback content when role not matched
 * <RequireRole roles={['premium', 'god']} fallback={<UpgradePrompt />}>
 *   <PremiumFeature />
 * </RequireRole>
 */

import type { ReactNode } from 'react';
import { useRole } from '../../hooks/useRole';
import type { Role } from '@daicer/engine';

interface RequireRoleProps {
  /** Roles that are allowed to see the content */
  roles: Role[];
  /** Content to render if user has required role */
  children: ReactNode;
  /** Optional fallback content to show when role requirement is not met */
  fallback?: ReactNode;
}

/**
 * Guard component that conditionally renders based on user role
 */
export function RequireRole({ roles, children, fallback = null }: RequireRoleProps) {
  const { hasRole, loading } = useRole();

  // Don't render anything while loading
  if (loading) {
    return null;
  }

  // Check if user has required role
  if (hasRole(roles)) {
    return children;
  }

  // Show fallback if provided
  return fallback;
}
