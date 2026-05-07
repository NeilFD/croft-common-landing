import { registerServiceWorker, isStandalone } from './registerPWA';
import { mountInstallOverlay } from './InstallPromptOverlay';
import { mountNotificationsOverlay } from './NotificationsPromptOverlay';
import { supabase } from '@/integrations/supabase/client';
import { BRAND_LOGO } from '@/data/brand';

// Prefetch critical routes after idle
function prefetchCriticalRoutes() {
  const run = () => {
    import('../pages/Book').catch(() => {});
    import('../pages/management/ManagementLogin').catch(() => {});
    import('../pages/Hall').catch(() => {});
    import('../pages/CommonRoom').catch(() => {});
    import('../pages/CommonRoomMain').catch(() => {});
  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 3000);
  }
}

export const initializePWA = async () => {
  try {
    // Detect preview/iframe contexts and never run PWA there
    const isInIframe = (() => {
      try { return window.self !== window.top; } catch { return true; }
    })();
    const host = window.location.hostname;
    const isPreviewHost =
      host.includes('id-preview--') || host.includes('lovableproject.com') || host.includes('lovable.app');

    if (isPreviewHost || isInIframe) {
      // Aggressively clean any prior SW + caches inside preview/iframe
      try {
        const regs = await navigator.serviceWorker?.getRegistrations?.();
        await Promise.all((regs || []).map((r) => r.unregister()));
      } catch {}
      try {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      } catch {}
      console.log('[PWA] Skipped in preview/iframe context');
      return;
    }

    const path = window.location.pathname;
    if (path.startsWith('/admin')) {
      console.log('[PWA] Skipping initialization for admin paths');
      return;
    }

    console.log('[PWA] Starting initialization sequence', { path });

    // Preload critical brand assets
    try {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = BRAND_LOGO;
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);
    } catch {}

    // Register service worker (no auto-reload, no forced update)
    let reg: ServiceWorkerRegistration | null = null;
    try {
      reg = await registerServiceWorker();
      if (reg) {
        console.log('[PWA] Service worker registered successfully');
        prefetchCriticalRoutes();
      }
    } catch (e) {
      console.error('[PWA] Service worker registration failed:', e);
      return;
    }

    // Defer non-critical PWA UI
    setTimeout(() => {
      try {
        if (!isStandalone) mountInstallOverlay();
        if (reg) mountNotificationsOverlay(reg);
      } catch (e) {
        console.warn('[PWA] Failed to mount overlays:', e);
      }
    }, 2000);

    // Opportunistic push subscription linking
    try {
      if (reg) {
        const [{ data: user }, sub] = await Promise.all([
          supabase.auth.getUser(),
          reg.pushManager.getSubscription(),
        ]);
        const endpoint = (sub?.toJSON() as any)?.endpoint as string | undefined;
        const userId = user.user?.id;
        if (userId && endpoint) {
          void supabase.functions.invoke('auto-link-push-subscription', { body: { endpoint } });
        }
      }
    } catch {}

    // Track notification opens
    try {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('ntk');
      if (token) {
        try { sessionStorage.setItem('notifications.last_ntk', token); } catch {}
        void supabase.functions.invoke('track-notification-event', {
          body: { type: 'notification_open', token },
        });
        url.searchParams.delete('ntk');
        window.history.replaceState({}, document.title, url.toString());
      }
    } catch {}

    (window as any).__pwaReg = reg;
  } catch (error) {
    console.error('[PWA] Initialization error:', error);
  }
};
