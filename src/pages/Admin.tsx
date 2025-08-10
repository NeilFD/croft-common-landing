import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminNotificationsApp } from "../admin/AdminNotificationsApp";

const Admin: React.FC = () => {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    // 1) Ensure SW doesn't interfere with admin auth flow
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) reg.unregister();
      }).catch(() => void 0);
    }

    // 2) Handle Supabase auth redirects (code or hash tokens) and clean URL
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          url.searchParams.delete('code');
          url.searchParams.delete('state'); // common provider param
          window.history.replaceState({}, document.title, url.toString());
          setBooted(true);
          return;
        }

        // Support legacy hash fragments: #access_token=...&refresh_token=...
        if (window.location.hash.includes('access_token')) {
          const hash = new URLSearchParams(window.location.hash.slice(1));
          const access_token = hash.get('access_token') || undefined;
          const refresh_token = hash.get('refresh_token') || undefined;
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          }
          // Clean hash
          const cleanUrl = new URL(window.location.href);
          cleanUrl.hash = '';
          window.history.replaceState({}, document.title, cleanUrl.toString());
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn('[Admin Auth] Redirect handling error', e);
      } finally {
        setBooted(true);
      }
    })();
  }, []);

  if (!booted) return null;
  return <AdminNotificationsApp />;
};

export default Admin;
