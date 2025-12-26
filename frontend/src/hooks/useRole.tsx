/**
 * Hook for accessing user role information
 */

import { useContext } from 'react';
import { RoleContext } from '../contexts/RoleContext';
import type { Role } from '@daicer/engine';

interface UseRoleReturn {
  role: Role;
  loading: boolean;
  isGod: boolean;
  isPremium: boolean;
  isFree: boolean;
  hasRole: (requiredRole: Role | Role[]) => boolean;
}

/**
 * Hook to access user role and convenience methods
 * @returns Role information and helper methods
 */
export function useRole(): UseRoleReturn {
  const { role, loading } = useContext(RoleContext);

  const isGod = role === 'god';
  const isPremium = role === 'premium' || role === 'god';
  const isFree = role === 'free';

  /**
   * Check if user has one of the required roles
   * @param requiredRole - Single role or array of allowed roles
   */
  const hasRole = (requiredRole: Role | Role[]): boolean => {
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role);
    }
    return role === requiredRole;
  };

  return {
    role,
    loading,
    isGod,
    isPremium,
    isFree,
    hasRole,
  };
}
