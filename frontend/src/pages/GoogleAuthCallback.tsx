import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DiceLoader } from '../components/ui/dice-loader';

export default function GoogleAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    // Debug logging
    console.info('[GoogleAuthCallback] Redirect params:', Object.fromEntries(params.entries()));

    // Prioritize 'jwt' from Strapi.
    // Strapi typically returns: ?jwt=...&user=...
    // Avoid 'id_token' or 'access_token' as those might be from Google.
    const jwt = params.get('jwt');

    if (jwt) {
      console.info('[GoogleAuthCallback] JWT found, saving to localStorage');
      localStorage.setItem('strapi_jwt', jwt);

      const userStr = params.get('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(decodeURIComponent(userStr));
          console.info('[GoogleAuthCallback] User object found:', userObj);
          // We could save this too, but useAuth fetches 'me' anyway.
        } catch (e) {
          console.warn('[GoogleAuthCallback] Failed to parse user object', e);
        }
      }

      navigate('/');
    } else {
      // Check for Google access_token to exchange for Strapi JWT
      const accessToken = params.get('access_token');

      if (accessToken) {
        console.info('[GoogleAuthCallback] Found access_token, attempting to exchange for Strapi JWT...');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337';

        // Clean params, only send access_token to avoid parameter pollution or backend confusion
        fetch(`${API_URL}/api/auth/google/callback?access_token=${accessToken}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((res) => res.json())
          .then((data) => {
            console.info('[GoogleAuthCallback] Exchange response:', data);
            if (data.jwt) {
              localStorage.setItem('strapi_jwt', data.jwt);
              navigate('/');
            } else {
              console.error(
                '[GoogleAuthCallback] Failed to exchange token. Full error:',
                JSON.stringify(data, null, 2)
              );
              // Try with id_token if access_token failed?
              // Or navigate to error
            }
          })
          .catch((err) => {
            console.error('[GoogleAuthCallback] Error exchanging token:', err);
          });
      } else {
        console.warn('[GoogleAuthCallback] No JWT or access_token found in params');
        const error = params.get('error');
        if (error) {
          console.error('[GoogleAuthCallback] Auth error:', error);
          // navigate('/error'); // Stay on page to see logs for now
        }
        // If no JWT and no error, maybe we are just waiting?
        // Or maybe params are different.
      }
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <DiceLoader size="large" message="Finalizing login..." />
        <p className="mt-4 text-slate-400">Please wait while we log you in.</p>
      </div>
    </div>
  );
}
