
import { registerServiceWorker, isStandalone } from './registerPWA';
import { mountInstallOverlay } from './InstallPromptOverlay';
import { mountNotificationsOverlay } from './NotificationsPromptOverlay';
import { supabase } from '@/integrations/supabase/client';

// Boot the PWA layer: register SW and mount overlay UI when appropriate
(async () => {
  const reg = await registerServiceWorker();
  if (!isStandalone) {
    mountInstallOverlay();
  }
  // Mount notifications prompt overlay (decides visibility internally)
  mountNotificationsOverlay(reg);

  // Track notification opens via URL token and then clean the URL
  try {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('ntk');
    if (token) {
      void supabase.functions.invoke('track-notification-event', {
        body: { type: 'notification_open', token },
      });
      url.searchParams.delete('ntk');
      window.history.replaceState({}, document.title, url.toString());
    }
  } catch (_) {}
  // Optionally, expose registration for debugging
  (window as any).__pwaReg = reg;
})();
