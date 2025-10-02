import { registerServiceWorker, isStandalone } from './registerPWA';
import { mountInstallOverlay } from './InstallPromptOverlay';
import { mountNotificationsOverlay } from './NotificationsPromptOverlay';
import { supabase } from '@/integrations/supabase/client';
import { BRAND_LOGO } from '@/data/brand';

export const initializePWA = async () => {
  try {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) {
      console.log('[PWA] Skipping initialization for admin paths');
      return;
    }
    
    console.log('[PWA] Starting initialization sequence');
    
    // Less aggressive cache clearing - only clear truly problematic ones
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const problematicCaches = cacheNames.filter(name => 
          name.includes('images-mobile-v') || 
          name.includes('hero-images')
        );
        
        if (problematicCaches.length > 0) {
          await Promise.all(problematicCaches.map(name => caches.delete(name)));
          console.log(`[PWA] Cleared ${problematicCaches.length} problematic cache(s)`);
        }
      } catch (e) {
        console.warn('[PWA] Cache clearing failed:', e);
      }
    }
    
    // Preload critical brand assets
    try {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = BRAND_LOGO;
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);
      console.log('[PWA] Preloaded brand assets');
    } catch (e) {
      console.warn('[PWA] Failed to preload brand assets:', e);
    }
    
    // Register service worker with error handling
    let reg: ServiceWorkerRegistration;
    try {
      reg = await registerServiceWorker();
      console.log('[PWA] Service worker registered successfully');
    } catch (e) {
      console.error('[PWA] Service worker registration failed:', e);
      // Continue without service worker - app should still work
      return;
    }
    
    // Defer non-critical PWA UI to improve load times
    setTimeout(() => {
      try {
        if (!isStandalone) {
          console.log('[PWA] Mounting install overlay');
          mountInstallOverlay();
        }
        console.log('[PWA] Mounting notifications overlay');
        mountNotificationsOverlay(reg);
      } catch (e) {
        console.warn('[PWA] Failed to mount overlays:', e);
      }
    }, 2000);

    // Opportunistic push subscription linking
    try {
      const [{ data: user }, sub] = await Promise.all([
        supabase.auth.getUser(),
        reg.pushManager.getSubscription(),
      ]);
      const endpoint = (sub?.toJSON() as any)?.endpoint as string | undefined;
      const userId = user.user?.id;
      if (userId && endpoint) {
        console.log('[PWA] Linking push subscription');
        void supabase.functions.invoke("auto-link-push-subscription", { body: { endpoint } });
      }
    } catch (e) {
      console.warn('[PWA] Push subscription linking failed:', e);
    }

    // Track notification opens
    try {
       const url = new URL(window.location.href);
       const token = url.searchParams.get('ntk');
       if (token) {
         console.log('[PWA] Tracking notification open');
         try {
           sessionStorage.setItem('notifications.last_ntk', token);
         } catch (_) {}
   
         void supabase.functions.invoke('track-notification-event', {
           body: { type: 'notification_open', token },
         });
         url.searchParams.delete('ntk');
         window.history.replaceState({}, document.title, url.toString());
       }
    } catch (e) {
      console.warn('[PWA] Notification tracking failed:', e);
    }
    
    (window as any).__pwaReg = reg;
    console.log('[PWA] Initialization complete');
    
  } catch (error) {
    console.error('[PWA] Initialization error:', error);
    // Don't throw - allow app to continue without PWA features
  }
};