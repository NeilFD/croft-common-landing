import React, { useEffect, useMemo, useState } from 'react';
import { enableNotifications, resetNotifications } from './notifications';
import { isStandalone, isIosSafari } from './registerPWA';
import { BRAND_LOGO } from '@/data/brand';
import { supabase } from '@/integrations/supabase/client';

// Key to avoid nagging users repeatedly
const DISMISS_KEY = 'notifications_prompt_dismissed_v2';

// Enhanced permission detection with multiple checks
async function canAskForNotifications(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  
  const permission = Notification.permission;
  console.log('🔔 Permission check - Browser permission:', permission);
  
  // If denied or already granted, don't ask
  if (permission === 'denied') {
    console.log('🔔 Permission check - Denied, not asking');
    return false;
  }
  
  if (permission === 'granted') {
    console.log('🔔 Permission check - Granted, checking for active subscription...');
    
    // Check if user has active push subscription
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user?.user?.id) {
        const { data: subscriptions, error } = await supabase
          .from('push_subscriptions')
          .select('id, is_active')
          .eq('user_id', user.user.id)
          .eq('is_active', true)
          .limit(1);
          
        if (error) {
          console.warn('🔔 Permission check - Error checking subscriptions:', error);
          return false; // If granted but can't check subscriptions, don't ask again
        }
        
        const hasActiveSubscription = subscriptions && subscriptions.length > 0;
        console.log('🔔 Permission check - Active subscriptions found:', hasActiveSubscription);
        
        if (hasActiveSubscription) {
          console.log('🔔 Permission check - User has active subscription, not asking');
          return false;
        }
      }
    } catch (error) {
      console.warn('🔔 Permission check - Error during subscription check:', error);
    }
  }
  
  const shouldAsk = permission === 'default';
  console.log('🔔 Permission check - Final decision:', shouldAsk);
  return shouldAsk;
}

const Banner: React.FC<{ onClose: () => void } & { swReg: ServiceWorkerRegistration | null }> = ({ onClose, swReg }) => {
  const [loading, setLoading] = useState(false);

  const onEnable = async () => {
    console.log('🔔 Banner: Enable button clicked');
    setLoading(true);
    try {
      // Check current permission state
      const currentPermission = Notification.permission;
      console.log('🔔 Banner: Current permission before enable:', currentPermission);
      
      // Ensure the system permission prompt appears if still default
      if (typeof window !== 'undefined' && 'Notification' in window && currentPermission === 'default') {
        console.log('🔔 Banner: Requesting system permission...');
        try {
          const newPermission = await Notification.requestPermission();
          console.log('🔔 Banner: System permission result:', newPermission);
        } catch (error) {
          console.warn('🔔 Banner: Error requesting permission:', error);
        }
      }

      // Get SW registration, waiting for ready if needed
      let reg = swReg || (await navigator.serviceWorker.getRegistration());
      if (!reg) {
        try {
          reg = await navigator.serviceWorker.ready;
        } catch {
          reg = null as any;
        }
      }

      if (reg) {
        console.log('🔔 Banner: Calling enableNotifications...');
        const ok = await enableNotifications(reg);
        console.log('🔔 Banner: enableNotifications result:', ok);
        if (ok) {
          console.log('🔔 Banner: Success! Dismissing overlay');
          localStorage.setItem(DISMISS_KEY, '1');
          onClose();
        } else {
          console.log('🔔 Banner: Failed to enable notifications');
        }
      } else {
        console.log('🔔 Banner: No service worker registration found');
      }
    } catch (error) {
      console.error('🔔 Banner: Error in onEnable:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-4 z-[10000] px-4">
      <div className="mx-auto max-w-xl rounded-lg border bg-background text-foreground shadow-xl">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <img src={BRAND_LOGO} alt="Croft Common logo" className="h-4 w-4 rounded-sm" loading="lazy" />
            <h3 className="text-sm font-medium">Enable notifications</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Get updates from Croft Common. You can change this later in your settings.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onEnable}
              disabled={loading}
              className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? 'Enabling…' : 'Enable notifications'}
            </button>
            <button
              onClick={() => {
                localStorage.setItem(DISMISS_KEY, '1');
                onClose();
              }}
              className="inline-flex items-center rounded-md border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Not now
            </button>
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  let reg = swReg || (await navigator.serviceWorker.getRegistration());
                  if (!reg) {
                    try {
                      reg = await navigator.serviceWorker.ready;
                    } catch {
                      reg = null as any;
                    }
                  }
                  if (reg) {
                    await resetNotifications(reg);
                  }
                } finally {
                  setLoading(false);
                }
              }}
              className="text-xs underline underline-offset-4 text-muted-foreground disabled:opacity-60"
            >
              Having trouble? Reset
            </button>
          </div>
          {isIosSafari() && (
            <p className="mt-2 text-xs text-muted-foreground">
              If you just enabled notifications in Settings, force-quit and reopen the app, then tap Enable.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const NotificationsOverlay: React.FC<{ swReg: ServiceWorkerRegistration | null }> = ({ swReg }) => {
  const [show, setShow] = useState(false);
  const [permissionCheckComplete, setPermissionCheckComplete] = useState(false);

  useEffect(() => {
    const checkShouldShow = async () => {
      console.log('🔔 Overlay: Starting permission check...');
      
      // Basic checks first
      if (!isStandalone) {
        console.log('🔔 Overlay: Not standalone, not showing');
        setPermissionCheckComplete(true);
        return;
      }
      
      if (localStorage.getItem(DISMISS_KEY) === '1') {
        console.log('🔔 Overlay: Previously dismissed, not showing');
        setPermissionCheckComplete(true);
        return;
      }
      
      // Enhanced permission check
      const canAsk = await canAskForNotifications();
      if (!canAsk) {
        console.log('🔔 Overlay: Cannot ask for notifications, not showing');
        setPermissionCheckComplete(true);
        return;
      }
      
      console.log('🔔 Overlay: All checks passed, showing prompt');
      setShow(true);
      setPermissionCheckComplete(true);
    };

    checkShouldShow();
  }, []);

  // Don't render anything until permission check is complete
  if (!permissionCheckComplete) return null;
  if (!show) return null;

  return <Banner onClose={() => setShow(false)} swReg={swReg} />;
};

export function mountNotificationsOverlay(swReg: ServiceWorkerRegistration | null) {
  // Avoid multiple mounts
  const existing = document.getElementById('notifications-overlay-root');
  if (existing) return;

  const container = document.createElement('div');
  container.id = 'notifications-overlay-root';
  document.body.appendChild(container);

  // Lazy import client renderer to keep initial bundle lean
  import('react-dom/client').then(({ createRoot }) => {
    const root = createRoot(container);
    root.render(React.createElement(NotificationsOverlay, { swReg }));
  });
}
