import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useTrackNotificationClick() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('ntk');
      const user = url.searchParams.get('user');
      if (!token) return;

      // Fire and forget (no UI noise)
      supabase.functions.invoke('track-notification-click', {
        body: { click_token: token, user_id: user || null }
      }).finally(() => {
        // Clean the URL so we don't re-trigger on navigation
        url.searchParams.delete('ntk');
        if (user) url.searchParams.delete('user');
        const newUrl = url.pathname + (url.search || '') + (url.hash || '');
        window.history.replaceState({}, '', newUrl);
      });
    } catch (e) {
      // silently ignore
    }
  }, []);
}
