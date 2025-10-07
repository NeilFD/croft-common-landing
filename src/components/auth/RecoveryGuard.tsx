import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// RecoveryGuard
// - Detects Supabase recovery/auth tokens synchronously via effect on route changes
// - Persists a `sessionStorage.recovery` flag
// - Forces navigation to /management/login while recovery is active
export const RecoveryGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const host = window.location.hostname;
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

      const type = params.get('type') || hashParams.get('type');
      const token = params.get('token') || hashParams.get('token');
      const isLoginRoute = location.pathname === '/management/login';
      const hasRecoveryTokens = Boolean(
        type === 'recovery' ||
        params.get('token_hash') || hashParams.get('token_hash') ||
        params.get('code') || hashParams.get('code') ||
        params.get('access_token') || hashParams.get('access_token') ||
        params.get('refresh_token') || hashParams.get('refresh_token') ||
        (token && isLoginRoute)
      );
 
      // Domain canonicalisation handled in index.html bootstrap script
 
      if (hasRecoveryTokens) {
        sessionStorage.setItem('recovery', '1');
      }

      const recoveryActive = sessionStorage.getItem('recovery') === '1';

      // Redirect to /management/login preserving all URL params
      if (recoveryActive && location.pathname !== '/management/login') {
        const redirectUrl = '/management/login' + 
                           window.location.search + 
                           window.location.hash;
        window.location.replace(redirectUrl);
      }
    } catch (e) {
      // no-op
    }
    // Re-run whenever route changes to keep guard active
  }, [location.pathname, location.search, location.hash, navigate]);

  return null;
};

