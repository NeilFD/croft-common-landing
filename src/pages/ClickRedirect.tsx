import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Minimal page that records the click, then redirects
export default function ClickRedirect() {
  const { token } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const go = async () => {
      const dest = params.get('u') || '/notifications';
      const user = params.get('user');
      try {
        if (token) {
          await supabase.functions.invoke('track-notification-click', {
            body: { click_token: token, user_id: user }
          });
        }
      } catch (_) {
        // ignore
      } finally {
        // Decode once; if invalid, just navigate to fallback
        try {
          const url = decodeURIComponent(dest);
          navigate(url.startsWith('/') ? url : '/notifications', { replace: true });
        } catch {
          navigate('/notifications', { replace: true });
        }
      }
    };
    go();
  }, [token, params, navigate]);

  return null;
}
