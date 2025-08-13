
import { registerServiceWorker, isStandalone } from './registerPWA';
import { mountInstallOverlay } from './InstallPromptOverlay';
import { mountNotificationsOverlay } from './NotificationsPromptOverlay';
import { supabase } from '@/integrations/supabase/client';

// Navigation intent handling: durable consume from Cache Storage and sessionStorage
const NAV_CACHE = 'sw-nav-v1';
const NAV_INTENT_URL = '/__sw_nav_intent';

async function consumeNavIntent(): Promise<boolean> {
  let url: string | null = null;
  try {
    url = sessionStorage.getItem('pwa.nav-intent');
    if (url) sessionStorage.removeItem('pwa.nav-intent');
  } catch (_) {}

  if (!url && 'caches' in window) {
    try {
      const cache = await caches.open(NAV_CACHE);
      const res = await cache.match(NAV_INTENT_URL);
      if (res) {
        const data = await res.json().catch(() => null) as any;
        await cache.delete(NAV_INTENT_URL);
        if (data && typeof data.url === 'string') {
          url = data.url;
        }
      }
    } catch (_) {}
  }

  if (url) {
    try {
      const target = new URL(url, window.location.origin);
      window.location.assign(target.toString());
    } catch {
      window.location.assign(url);
    }
    return true;
  }
  return false;
}

if ('serviceWorker' in navigator && !(window as any).__swNavigateListenerAdded) {
  (window as any).__swNavigateListenerAdded = true;
  navigator.serviceWorker.addEventListener('message', async (event) => {
    const data = (event as MessageEvent).data as any;
    if (data && data.type === 'SW_NAVIGATE' && typeof data.url === 'string') {
      try { sessionStorage.setItem('pwa.nav-intent', data.url); } catch (_) {}
      await consumeNavIntent();
    }
  });
}

// Consume any pending nav intent immediately on load and when app becomes visible/focused
void consumeNavIntent();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void consumeNavIntent();
});
window.addEventListener('focus', () => { void consumeNavIntent(); });

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

  // SW navigation listener moved to top-level for earlier attachment

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
