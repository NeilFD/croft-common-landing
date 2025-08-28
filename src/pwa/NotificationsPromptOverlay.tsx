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
  const [debugMode, setDebugMode] = useState(false);
  const [progress, setProgress] = useState<string>('');

  const updateProgress = (step: string) => {
    setProgress(step);
    console.log('🔔 Progress:', step);
  };

  const onEnable = async () => {
    console.log('🔔 Banner: Enable button clicked');
    setLoading(true);
    setError(null);
    setProgress('');
    
    try {
      updateProgress('Checking browser support...');
      
      // Enhanced browser support check
      if (!('Notification' in window)) {
        throw new Error('Push notifications are not supported in this browser');
      }
      
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers are not supported in this browser');
      }
      
      updateProgress('Checking permission status...');
      const currentPermission = Notification.permission;
      console.log('🔔 Banner: Current permission before enable:', currentPermission);
      
      // Enhanced permission handling
      if (currentPermission === 'denied') {
        throw new Error('Notifications are blocked. Please enable them in your browser settings and refresh the page.');
      }
      
      updateProgress('Getting service worker registration...');
      
      // Enhanced service worker registration handling with timeout
      let reg = swReg;
      if (!reg) {
        console.log('🔔 Banner: No SW registration provided, getting from navigator...');
        try {
          // Try to get existing registration first
          reg = await navigator.serviceWorker.getRegistration();
          if (!reg) {
            console.log('🔔 Banner: No existing registration, waiting for ready...');
            // Wait for service worker to be ready with timeout
            const readyPromise = navigator.serviceWorker.ready;
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Service worker timeout')), 10000)
            );
            reg = await Promise.race([readyPromise, timeoutPromise]) as ServiceWorkerRegistration;
          }
        } catch (error) {
          console.error('🔔 Banner: SW registration error:', error);
          throw new Error('Service worker is not ready. Please refresh the page and try again.');
        }
      }

      if (!reg) {
        throw new Error('Could not get service worker registration');
      }

      console.log('🔔 Banner: SW registration ready:', reg.scope);
      updateProgress('Enabling notifications...');

      // Call enableNotifications with enhanced error handling
      const success = await enableNotifications(reg);
      
      if (success) {
        updateProgress('Success! Notifications enabled.');
        console.log('🔔 Banner: Success! Dismissing overlay');
        localStorage.setItem(DISMISS_KEY, '1');
        
        // Small delay to show success message
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        // Enhanced error message based on platform
        let errorMessage = 'Failed to enable notifications. Please try again.';
        
        if (isIosSafari()) {
          if (!isStandalone) {
            errorMessage = 'Please add this app to your Home Screen first, then try enabling notifications.';
          } else {
            errorMessage = 'Go to Settings → Notifications → Croft Common → Allow Notifications. Then force-quit and reopen the app.';
          }
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('🔔 Banner: Error in onEnable:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      updateProgress('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-4 z-[10000] px-4">
      <div className="mx-auto max-w-xl rounded-lg border bg-background text-foreground shadow-xl">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={BRAND_LOGO} alt="Croft Common logo" className="h-4 w-4 rounded-sm" loading="lazy" />
              <h3 className="text-sm font-medium">Enable notifications</h3>
            </div>
            {/* Debug toggle for development */}
            {import.meta.env.DEV && (
              <button
                onClick={() => setDebugMode(!debugMode)}
                className="text-xs text-muted-foreground underline"
              >
                Debug
              </button>
            )}
          </div>
          
          <p className="mt-1 text-sm text-muted-foreground">
            Get updates from Croft Common. You can change this later in your settings.
          </p>
          
          {/* Error display */}
          {error && (
            <div className="mt-2 rounded-md bg-destructive/10 p-2">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
          
          {/* Progress display */}
          {loading && progress && (
            <div className="mt-2 rounded-md bg-muted p-2">
              <p className="text-xs text-muted-foreground">{progress}</p>
            </div>
          )}
          
          {/* Debug info */}
          {debugMode && (
            <div className="mt-2 rounded-md bg-muted p-2">
              <p className="text-xs font-mono text-muted-foreground">
                Permission: {Notification.permission}<br/>
                Platform: {/iPad|iPhone|iPod/.test(navigator.userAgent) ? 'iOS' : 'Other'}<br/>
                Standalone: {isStandalone ? 'Yes' : 'No'}<br/>
                SW Support: {'serviceWorker' in navigator ? 'Yes' : 'No'}
              </p>
            </div>
          )}
          
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onEnable}
              disabled={loading}
              className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? (progress ? 'Processing...' : 'Enabling...') : 'Enable notifications'}
            </button>
            <button
              onClick={() => {
                localStorage.setItem(DISMISS_KEY, '1');
                onClose();
              }}
              disabled={loading}
              className="inline-flex items-center rounded-md border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              Not now
            </button>
            <button
              onClick={async () => {
                setLoading(true);
                setError(null);
                updateProgress('Resetting notifications...');
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
                    updateProgress('Reset complete. Try enabling again.');
                    setTimeout(() => setProgress(''), 2000);
                  } else {
                    throw new Error('No service worker found');
                  }
                } catch (error) {
                  setError('Reset failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="text-xs underline underline-offset-4 text-muted-foreground disabled:opacity-60"
            >
              Reset
            </button>
          </div>
          
          {isIosSafari() && (
            <div className="mt-2 rounded-md bg-blue-50 p-2 dark:bg-blue-950/20">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>iOS Users:</strong> If you just enabled notifications in Settings, force-quit and reopen the app, then tap Enable.
                {!isStandalone && (
                  <> First, add this app to your Home Screen (Share → Add to Home Screen).</>
                )}
              </p>
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
