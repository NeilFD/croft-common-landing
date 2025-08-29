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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onEnable = async () => {
    console.log('🔔 Banner: Enable button clicked');
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Basic browser support check
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        throw new Error('Notifications are not supported in this browser');
      }

      // Check if notifications are already blocked
      if (Notification.permission === 'denied') {
        throw new Error('Notifications are blocked. Please enable them in your browser settings and refresh the page.');
      }
      
      // Get service worker registration
      let reg = swReg;
      if (!reg) {
        reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
          reg = await navigator.serviceWorker.ready;
        }
      }

      if (!reg) {
        throw new Error('Service worker is not available. Please refresh the page and try again.');
      }

      // Enable notifications
      const success = await enableNotifications(reg);
      
      if (success) {
        setSuccess(true);
        localStorage.setItem(DISMISS_KEY, '1');
        
        // Auto-close after showing success
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error('Failed to register for notifications. Please try again or check your device settings.');
      }
    } catch (error) {
      console.error('🔔 Banner: Error enabling notifications:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-4 z-[10000] px-4">
      <div className="mx-auto max-w-sm rounded-lg border bg-background text-foreground shadow-xl">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <img src={BRAND_LOGO} alt="Croft Common logo" className="h-4 w-4 rounded-sm" loading="lazy" />
            <h3 className="text-sm font-medium">Enable notifications</h3>
          </div>
          
          <p className="mt-1 text-sm text-muted-foreground">
            Get updates from Croft Common
          </p>
          
          {/* Success state */}
          {success && (
            <div className="mt-3 rounded-md bg-green-50 dark:bg-green-950/20 p-3 text-center">
              <div className="text-green-600 dark:text-green-400">
                <svg className="mx-auto h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium">Notifications enabled!</p>
                <p className="text-xs mt-1">You'll now receive updates from Croft Common</p>
              </div>
            </div>
          )}
          
          {/* Error state */}
          {error && !success && (
            <div className="mt-3 rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
              {isIosSafari() && (
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>iPhone users:</strong> Make sure to add this app to your Home Screen first, then enable notifications in Settings → Notifications → Croft Common.
                </p>
              )}
            </div>
          )}
          
          {/* Loading state */}
          {loading && (
            <div className="mt-3 rounded-md bg-muted p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
                <p className="text-sm text-muted-foreground">Setting up notifications...</p>
              </div>
            </div>
          )}
          
          {/* Actions */}
          {!success && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={onEnable}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? 'Enabling...' : 'Enable notifications'}
              </button>
              <button
                onClick={() => {
                  localStorage.setItem(DISMISS_KEY, '1');
                  onClose();
                }}
                disabled={loading}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                Not now
              </button>
            </div>
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
