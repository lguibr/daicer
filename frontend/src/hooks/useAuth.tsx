/**
 * Authentication hook
 */

import { useState, useEffect } from 'react';

// Use strict Strapi URL or env var
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337';

export interface User {
  id: number;
  documentId: string; // Strapi v5
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: (User & { uid: string; displayName: string; getIdToken: () => Promise<string> }) | null;
  loading: boolean;
  error: string | null;
}

/**
 * Authentication hook
 * @returns Auth state and methods
 */
export default function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('strapi_jwt');
    if (token) {
      // Validate token and fetch user
      fetch(`${API_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error('Invalid token');
          }
          const userData = await res.json();
          // Map to backward compatible format
          const userWithLegacyFields = {
            ...userData,
            uid: userData.id.toString(),
            displayName: userData.username,
            getIdToken: async () => token,
          };
          setState({
            user: userWithLegacyFields,
            loading: false,
            error: null,
          });
        })
        .catch(() => {
          // If token invalid, clear it
          localStorage.removeItem('strapi_jwt');
          setState({
            user: null,
            loading: false,
            error: null,
          });
        });
    } else {
      setTimeout(() => {
        setState((prev) => ({ ...prev, loading: false }));
      }, 0);
    }
  }, []);

  /**
   * Sign in with Google
   * Redirects to Strapi Google Auth endpoint
   */
  const signInWithGoogle = () => {
    window.location.href = `${API_URL}/api/connect/google`;
  };

  /**
   * Sign out
   */
  const signOut = () => {
    localStorage.removeItem('strapi_jwt');
    setState({ user: null, loading: false, error: null });
    // Optional: Redirect to home or reload
    window.location.href = '/';
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signInWithGoogle,
    signOut,
  };
}
