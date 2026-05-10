import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// RecoveryGuard
// - Detects Bears Den member password recovery tokens (NOT management).
// - Only routes to /set-password when the recovery flow lands on a non-management path.
// - Management login handles its own recovery flow internally and must not be
//   hijacked to /set-password.
export const RecoveryGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

      const type = params.get('type') || hashParams.get('type');
      const hasRecoveryTokens = Boolean(
        type === 'recovery' ||
        params.get('token_hash') || hashParams.get('token_hash') ||
        params.get('code') || hashParams.get('code') ||
        params.get('access_token') || hashParams.get('access_token') ||
        params.get('refresh_token') || hashParams.get('refresh_token')
      );

      if (hasRecoveryTokens) {
        sessionStorage.setItem('recovery', '1');
      }

      const recoveryActive = sessionStorage.getItem('recovery') === '1';
      const path = location.pathname;

      // Never redirect away from management routes — they own their own recovery UI.
      if (path.startsWith('/management')) return;

      if (recoveryActive && path !== '/set-password') {
        const redirectUrl = '/set-password' +
                           window.location.search +
                           window.location.hash;
        window.location.replace(redirectUrl);
      }
    } catch (e) {
      // no-op
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  return null;
};
