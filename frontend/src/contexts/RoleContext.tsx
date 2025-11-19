/**
 * Role Context for user authorization
 * Provides role information from Firebase custom claims
 */

import { createContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import type { Role } from '../types/shared';

interface RoleContextValue {
  role: Role;
  loading: boolean;
}

export const RoleContext = createContext<RoleContextValue>({
  role: 'free',
  loading: true,
});

interface RoleProviderProps {
  children: ReactNode;
}

/**
 * RoleProvider wraps the app and provides role context from Firebase custom claims
 */
export function RoleProvider({ children }: RoleProviderProps) {
  const [role, setRole] = useState<Role>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get ID token result which includes custom claims
          const tokenResult = await user.getIdTokenResult();
          const userRole = (tokenResult.claims.role as Role) || 'free';
          setRole(userRole);
        } catch (error) {
          console.error('Failed to get user role:', error);
          setRole('free');
        }
      } else {
        setRole('free');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(() => ({ role, loading }), [role, loading]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
