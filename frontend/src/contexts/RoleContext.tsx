/**
 * Role Context for user authorization
 * Placeholder during Firebase removal
 */

import { createContext, useMemo, type ReactNode } from 'react';
import type { Role } from '../types/shared';

interface RoleContextValue {
  role: Role;
  loading: boolean;
}

export const RoleContext = createContext<RoleContextValue>({
  role: 'free',
  loading: false,
});

interface RoleProviderProps {
  children: ReactNode;
}

/**
 * RoleProvider Stub
 */
export function RoleProvider({ children }: RoleProviderProps) {
  const role: Role = 'free'; // Default to free role
  const loading = false;

  const value = useMemo(() => ({ role, loading }), [role, loading]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
