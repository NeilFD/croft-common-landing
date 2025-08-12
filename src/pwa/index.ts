
import { registerServiceWorker, isStandalone } from './registerPWA';
import { mountInstallOverlay } from './InstallPromptOverlay';
import { mountNotificationsOverlay } from './NotificationsPromptOverlay';
import { supabase } from '@/integrations/supabase/client';

// Boot the PWA layer: register SW and mount overlay UI when appropriate
(async () => {
  const path = window.location.pathname;
  if (path.startsWith('/admin')) {
    if (import.meta.env.DEV) console.info('[PWA] Skipping SW on /admin');
    return;
  }
  const reg = await registerServiceWorker();
  if (!isStandalone) {
    mountInstallOverlay();
  }
  // Mount notifications prompt overlay (decides visibility internally)
  mountNotificationsOverlay(reg);

  // SW message fallback to force navigation on notification clicks when app is open
  if ('serviceWorker' in navigator && !(window as any).__swNavigateListenerAdded) {
    (window as any).__swNavigateListenerAdded = true;
    navigator.serviceWorker.addEventListener('message', (event) => {
      const data = (event as MessageEvent).data as any;
      if (data && data.type === 'SW_NAVIGATE' && typeof data.url === 'string') {
        try {
          const target = new URL(data.url, window.location.origin);
          // Always let the notification URL dominate
          window.location.assign(target.toString());
        } catch {
          window.location.assign(data.url);
        }
      }
    });
  }

  // Opportunistic linking: if user is signed in and a subscription exists, link it to the user
  try {
    const [{ data: user }, sub] = await Promise.all([
      supabase.auth.getUser(),
      reg.pushManager.getSubscription(),
    ]);
    const endpoint = (sub?.toJSON() as any)?.endpoint as string | undefined;
    const userId = user.user?.id;
    if (userId && endpoint) {
      void supabase.functions.invoke("auto-link-push-subscription", { body: { endpoint } });
    }
  } catch (e) {
    // non-fatal
    if (import.meta.env.DEV) console.warn("[PWA] Opportunistic link failed", e);
  }

  // Track notification opens via URL token and then clean the URL
  try {
     const url = new URL(window.location.href);
     const token = url.searchParams.get('ntk');
     if (token) {
       try {
         // Persist the token so feature pages can read it even if URL gets cleaned
         sessionStorage.setItem('notifications.last_ntk', token);
       } catch (_) {}
 
       void supabase.functions.invoke('track-notification-event', {
         body: { type: 'notification_open', token },
       });
       // Clean the URL
       url.searchParams.delete('ntk');
       window.history.replaceState({}, document.title, url.toString());
     }
  } catch (_) {}
  // Optionally, expose registration for debugging
  (window as any).__pwaReg = reg;
})();
