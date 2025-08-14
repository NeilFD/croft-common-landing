import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useBannerNotification } from '@/contexts/BannerNotificationContext';
import { toast } from '@/hooks/use-toast';

/**
 * Universal deep link handler for PWA notifications
 * Processes notification tokens and handles tracking across all routes
 */
export const useNotificationHandler = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { showBanner } = useBannerNotification();

  useEffect(() => {
    const token = searchParams.get('ntk');
    const userId = searchParams.get('user');
    
    if (!token) return;

    const handleNotificationTracking = async () => {
      try {
        // Track notification open
        await supabase.functions.invoke('track-notification-event', {
          body: { 
            type: 'notification_open', 
            token, 
            url: window.location.href,
            user_id: userId 
          },
        });

        // Store token for future reference
        try {
          sessionStorage.setItem('notifications.last_ntk', token);
          if (userId) {
            sessionStorage.setItem('notifications.last_user', userId);
          }
        } catch {
          // Silent fail for storage issues
        }

      } catch (error) {
        console.warn('[NotificationHandler] Error processing notification:', error);
      }
    };

    handleNotificationTracking();
  }, [location.pathname, searchParams]);

  // Enhanced message handling with comprehensive debugging
  useEffect(() => {
    console.log('🔔 App: Setting up enhanced notification message listeners');
    
    const handleMessage = (event: MessageEvent) => {
      console.log('🔔 App: Message received:', {
        type: event.data?.type,
        origin: event.origin,
        source: event.source === window ? 'window' : 'other',
        data: event.data
      });
      
      
      
      // Handle all banner-related message types
      if (event.data?.type === 'SHOW_BANNER' || 
          event.data?.type === 'CHECK_BANNER_STORAGE' || 
          event.data?.type === 'FORCE_BANNER_CHECK') {
        
        const bannerData = event.data.data;
        console.log('🔔 App: Processing banner message:', {
          messageType: event.data.type,
          bannerData,
          bannerMessage: bannerData.bannerMessage,
          body: bannerData.body
        });
        
        
        
        showBanner({
          title: bannerData.title || 'Notification',
          body: bannerData.body || '',
          bannerMessage: bannerData.bannerMessage,
          url: bannerData.url,
          icon: bannerData.icon,
          notificationId: bannerData.notificationId,
          clickToken: bannerData.clickToken
        });
      }
    };

    // Method 1: Service Worker messages with registration check
    console.log('🔔 App: Registering service worker message listener');
    navigator.serviceWorker?.addEventListener('message', handleMessage);
    
    // Method 2: Window messages (all origins for PWA compatibility)
    console.log('🔔 App: Registering window message listener');
    window.addEventListener('message', handleMessage);

    // Method 3: BroadcastChannel listener
    let broadcastChannel: BroadcastChannel | null = null;
    try {
      broadcastChannel = new BroadcastChannel('croft-banner-notifications');
      broadcastChannel.addEventListener('message', handleMessage);
      console.log('🔔 App: ✅ BroadcastChannel listener registered');
    } catch (error) {
      console.warn('🔔 App: ❌ BroadcastChannel not supported:', error);
    }

    // Method 4: Check localStorage for pending notifications
    const checkPendingNotifications = () => {
      try {
        const pendingStr = localStorage.getItem('pending-banner-notification');
        if (pendingStr) {
          const pending = JSON.parse(pendingStr);
          const age = Date.now() - pending.timestamp;
          
          // Only process if less than 30 seconds old
          if (age < 30000) {
            console.log('🔔 App: Found pending banner notification in localStorage:', pending);
            handleMessage(pending);
            localStorage.removeItem('pending-banner-notification');
          } else {
            // Clean up old notifications
            localStorage.removeItem('pending-banner-notification');
          }
        }
      } catch (error) {
        console.warn('🔔 App: ❌ Failed to check pending notifications:', error);
      }
      
      // Also check URL params
      const currentParams = new URLSearchParams(window.location.search);
      if (currentParams.get('ntk')) {
        console.log('🔔 App: Detected notification token in URL');
      }
    };

    // Method 5: Visibility change listener for immediate message checking
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔔 App: App became visible - checking for pending notifications');
        checkPendingNotifications();
        
        // Send focus signal to service worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'APP_FOCUSED',
            timestamp: Date.now(),
            url: window.location.href
          });
        }
      }
    };

    // Method 6: Window focus listener as backup
    const handleWindowFocus = () => {
      console.log('🔔 App: Window focused - checking for pending notifications');
      checkPendingNotifications();
    };

    // Register all event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    
    // Initial check for pending notifications when component mounts
    checkPendingNotifications();

    // Enhanced service worker registration with retry
    if ('serviceWorker' in navigator) {
      const setupServiceWorkerCommunication = async () => {
        try {
          const registration = await navigator.serviceWorker.ready;
          console.log('🔔 App: ✅ Service worker ready, registration:', registration);
          
          // Send comprehensive ready signal
          if (registration.active) {
            registration.active.postMessage({
              type: 'APP_READY',
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
              isStandalone: window.matchMedia('(display-mode: standalone)').matches
            });
            console.log('🔔 App: ✅ Ready signal sent to service worker');
          }
          
          // Set up message listener specifically for the active service worker
          if (registration.active) {
            registration.active.addEventListener?.('message', handleMessage);
          }
          
        } catch (error) {
          console.warn('🔔 App: ❌ Service worker setup failed:', error);
        }
      };
      
      setupServiceWorkerCommunication();
    }

    // Cleanup on unmount
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      broadcastChannel?.close();
      // No interval to clear
    };
  }, [showBanner]);

  // Clean URL of notification parameters after handling
  useEffect(() => {
    const token = searchParams.get('ntk');
    const userId = searchParams.get('user');
    
    if (token || userId) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('ntk');
      newSearchParams.delete('user');
      
      const newUrl = `${location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}${location.hash}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.pathname, searchParams]);
};