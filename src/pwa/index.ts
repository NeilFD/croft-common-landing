
import { registerServiceWorker, isStandalone } from './registerPWA';
import { mountInstallOverlay } from './InstallPromptOverlay';
import { mountNotificationsOverlay } from './NotificationsPromptOverlay';
import { mountNavIntentOverlay } from './NavIntentOverlay';
import { supabase } from '@/integrations/supabase/client';

// Navigation intent handling: durable consume from Cache Storage and sessionStorage
const NAV_CACHE = 'sw-nav-v1';
const NAV_INTENT_URL = '/__sw_nav_intent';

// iOS standalone detection
const isiOS = /iPad|iPhone|iPod/i.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
const isIOSStandalone = isiOS && isStandalone;
async function consumeNavIntent(): Promise<boolean> {
  let url: string | null = null;
  const now = Date.now();
  const TTL = 5 * 60 * 1000; // 5 minutes
  
  try {
    const sessionData = sessionStorage.getItem('pwa.nav-intent');
    if (sessionData) {
      try {
        const intent = JSON.parse(sessionData);
        const ttl = intent.ttl || TTL;
        if (now - intent.timestamp > ttl) {
          if (import.meta.env.DEV) console.info('[PWA] SessionStorage intent expired, clearing');
          sessionStorage.removeItem('pwa.nav-intent');
        } else {
          url = intent.url;
        }
      } catch (e) {
        // Handle legacy string format - clear it
        sessionStorage.removeItem('pwa.nav-intent');
      }
    }
  } catch (_) {}

  if (!url && 'caches' in window) {
    try {
      const cache = await caches.open(NAV_CACHE);
      const res = await cache.match(NAV_INTENT_URL);
      if (res) {
        const data = await res.json().catch(() => null) as any;
        if (data && typeof data.url === 'string' && typeof data.timestamp === 'number') {
          const ttl = data.ttl || TTL;
          if (now - data.timestamp > ttl) {
            if (import.meta.env.DEV) console.info('[PWA] Cache intent expired, clearing');
            await cache.delete(NAV_INTENT_URL);
          } else {
            url = data.url;
          }
        } else if (data && typeof data.url === 'string') {
          // Legacy format - clear it
          await cache.delete(NAV_INTENT_URL);
        }
      }
    } catch (_) {}
  }

  if (url) {
    if (import.meta.env.DEV) console.info('[PWA] consumeNavIntent found URL:', url);
    
    // On mobile devices, skip programmatic navigation and rely on user gesture via overlay
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile || isIOSStandalone) {
      if (import.meta.env.DEV) console.info('[PWA] Mobile device - skipping programmatic nav, letting overlay handle it');
      return false;
    }
    
    // Only try programmatic navigation on desktop
    try {
      const target = new URL(url, window.location.origin);
      if (import.meta.env.DEV) console.info('[PWA] Attempting programmatic navigation to:', target.toString());
      window.location.assign(target.toString());
      
      // Clear the intent only after successful navigation
      setTimeout(() => {
        try { sessionStorage.removeItem('pwa.nav-intent'); } catch (_) {}
        if ('caches' in window) {
          caches.open(NAV_CACHE).then(cache => cache.delete(NAV_INTENT_URL)).catch(() => {});
        }
      }, 100);
      
      return true;
    } catch {
      if (import.meta.env.DEV) console.info('[PWA] Programmatic navigation failed, keeping intent for overlay');
      // Don't try fallback navigation - let overlay handle it
      return false;
    }
  }
  return false;
}

if ('serviceWorker' in navigator && !(window as any).__swNavigateListenerAdded) {
  (window as any).__swNavigateListenerAdded = true;
  navigator.serviceWorker.addEventListener('message', async (event) => {
    const data = (event as MessageEvent).data as any;
      if (data && data.type === 'SW_NAVIGATE' && typeof data.url === 'string') {
        const intent = { url: data.url, timestamp: Date.now(), ttl: 5 * 60 * 1000 };
        try { sessionStorage.setItem('pwa.nav-intent', JSON.stringify(intent)); } catch (_) {}
        if (import.meta.env.DEV) console.info('[PWA] Received SW_NAVIGATE message:', data.url);
        
        // Force show the overlay first
        if (import.meta.env.DEV) console.info('[PWA] Attempting to show overlay...');
        try { 
          if ((window as any).__navIntentOverlayShow) {
            (window as any).__navIntentOverlayShow(data.url);
            if (import.meta.env.DEV) console.info('[PWA] Overlay show function called successfully');
          } else {
            if (import.meta.env.DEV) console.warn('[PWA] __navIntentOverlayShow not available');
          }
        } catch (e) {
          if (import.meta.env.DEV) console.error('[PWA] Error calling overlay show:', e);
        }
        
        const ok = await consumeNavIntent();
        if (!ok) {
          if (import.meta.env.DEV) console.info('[PWA] Programmatic nav failed, overlay should be showing');
        }
      }
  });
}

// Also listen via BroadcastChannel for more reliable delivery on iOS
if ('BroadcastChannel' in window && !(window as any).__navBcAdded) {
  (window as any).__navBcAdded = true;
  try {
    const bc = new BroadcastChannel('nav-handoff-v1');
    bc.addEventListener('message', async (event) => {
      const data = (event as MessageEvent).data as any;
      if (data && data.type === 'SW_NAVIGATE' && typeof data.url === 'string') {
        const intent = { url: data.url, timestamp: Date.now(), ttl: 5 * 60 * 1000 };
        try { sessionStorage.setItem('pwa.nav-intent', JSON.stringify(intent)); } catch (_) {}
        if (import.meta.env.DEV) console.info('[PWA] Received SW_NAVIGATE via BC:', data.url);
        
        // Force show the overlay first
        if (import.meta.env.DEV) console.info('[PWA] Attempting to show overlay via BC...');
        try { 
          if ((window as any).__navIntentOverlayShow) {
            (window as any).__navIntentOverlayShow(data.url);
            if (import.meta.env.DEV) console.info('[PWA] Overlay show function called successfully via BC');
          } else {
            if (import.meta.env.DEV) console.warn('[PWA] __navIntentOverlayShow not available via BC');
          }
        } catch (e) {
          if (import.meta.env.DEV) console.error('[PWA] Error calling overlay show via BC:', e);
        }
        
        const ok = await consumeNavIntent();
        if (!ok) {
          if (import.meta.env.DEV) console.info('[PWA] Programmatic nav failed via BC, overlay should be showing');
        }
      }
    });
  } catch (_) {}
}

// Short burst polling on resume to catch intents even if focus/visibility events are flaky
let __burstTimer: number | null = null;
async function burstConsume(durationMs = 2000, intervalMs = 150) {
  const start = Date.now();
  if (__burstTimer) { clearInterval(__burstTimer); __burstTimer = null; }
  __burstTimer = window.setInterval(async () => {
    const consumed = await consumeNavIntent();
    if (consumed || Date.now() - start > durationMs) {
      if (__burstTimer) { clearInterval(__burstTimer); __burstTimer = null; }
    }
  }, intervalMs);
  // Try once immediately as well
  void consumeNavIntent();
}

// Consume any pending nav intent immediately on load and when app becomes visible/focused
void consumeNavIntent();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') burstConsume();
});
window.addEventListener('focus', () => { burstConsume(); });

// Boot the PWA layer: register SW and mount overlay UI when appropriate
(async () => {
  const path = window.location.pathname;
  if (path.startsWith('/admin')) {
    if (import.meta.env.DEV) console.info('[PWA] Skipping SW on /admin');
    return;
  }
  
  // Clean up expired intents before processing
  const { cleanupExpiredIntents } = await import('./NavIntentOverlay');
  await cleanupExpiredIntents();
  
  // Mount nav intent overlay FIRST to ensure it's ready to receive messages
  if (import.meta.env.DEV) console.info('[PWA] Mounting nav intent overlay');
  await mountNavIntentOverlay();
  if (import.meta.env.DEV) console.info('[PWA] Nav intent overlay mounted, testing function availability:', typeof (window as any).__navIntentOverlayShow);
  
  const reg = await registerServiceWorker();
  if (!isStandalone) {
    if (import.meta.env.DEV) console.info('[PWA] Not standalone: showing install overlay');
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
