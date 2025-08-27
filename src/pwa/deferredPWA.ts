import { registerServiceWorker, isStandalone } from './registerPWA';
import { mountInstallOverlay } from './InstallPromptOverlay';
import { mountNotificationsOverlay } from './NotificationsPromptOverlay';
import { supabase } from '@/integrations/supabase/client';
import { BRAND_LOGO } from '@/data/brand';

export const initializePWA = async () => {
  const path = window.location.pathname;
  if (path.startsWith('/admin')) {
    return;
  }
  
  // Preload critical brand assets
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = BRAND_LOGO;
  link.setAttribute('fetchpriority', 'high');
  document.head.appendChild(link);
  
  const reg = await registerServiceWorker();
  if (!isStandalone) {
    mountInstallOverlay();
  }
  mountNotificationsOverlay(reg);

  // Opportunistic linking
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
  }

  // Track notification opens
  try {
     const url = new URL(window.location.href);
     const token = url.searchParams.get('ntk');
     if (token) {
       try {
         sessionStorage.setItem('notifications.last_ntk', token);
       } catch (_) {}
 
       void supabase.functions.invoke('track-notification-event', {
         body: { type: 'notification_open', token },
       });
       url.searchParams.delete('ntk');
       window.history.replaceState({}, document.title, url.toString());
     }
  } catch (_) {}
  
  (window as any).__pwaReg = reg;
};