import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AUTH_ERROR_EVENT = 'auth-error';

export default function AuthEventHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthError = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.status === 403 || customEvent.detail?.status === 401) {
        // Clear any local state if needed?
        // Maybe we just redirect.
        // If 403 (Forbidden), redirect to safe zone or home.
        // If 401 (Unauthorized), redirect to login (home in this app seems to be landing/login).
        navigate('/');
      }
    };

    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError);
    return () => window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
  }, [navigate]);

  return null;
}
