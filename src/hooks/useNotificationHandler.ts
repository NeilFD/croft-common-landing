import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useBannerNotification } from '@/contexts/BannerNotificationContext';

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

  // Enhanced message handling with multiple channels
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('🔔 App: Received message:', event.data, 'from:', event.origin);
      
      if (event.data?.type === 'SHOW_BANNER') {
        const bannerData = event.data.data;
        console.log('🔔 App: Showing banner with data:', bannerData);
        showBanner({
          title: bannerData.title || 'Notification',
          body: bannerData.bannerMessage || bannerData.body || '',
          bannerMessage: bannerData.bannerMessage,
          url: bannerData.url,
          icon: bannerData.icon,
          notificationId: bannerData.notificationId,
          clickToken: bannerData.clickToken
        });
      } else if (event.data?.type === 'CHECK_BANNER_STORAGE') {
        // Handle localStorage fallback
        const bannerData = event.data.data;
        console.log('🔔 App: Storage fallback triggered with data:', bannerData);
        showBanner({
          title: bannerData.title || 'Notification',
          body: bannerData.bannerMessage || bannerData.body || '',
          bannerMessage: bannerData.bannerMessage,
          url: bannerData.url,
          icon: bannerData.icon,
          notificationId: bannerData.notificationId,
          clickToken: bannerData.clickToken
        });
      }
    };

    // Method 1: Service Worker messages
    navigator.serviceWorker?.addEventListener('message', handleMessage);
    
    // Method 2: Window messages (cross-origin)
    window.addEventListener('message', handleMessage);

    // Method 3: BroadcastChannel listener
    let broadcastChannel: BroadcastChannel | null = null;
    try {
      broadcastChannel = new BroadcastChannel('croft-banner-notifications');
      broadcastChannel.addEventListener('message', handleMessage);
      console.log('🔔 App: BroadcastChannel listener registered');
    } catch (error) {
      console.warn('🔔 App: BroadcastChannel not supported:', error);
    }

    // Method 4: Polling fallback for when app is active (runs every 2 seconds)
    const pollForNotifications = () => {
      // Check if there are any pending notification parameters in the URL
      const currentParams = new URLSearchParams(window.location.search);
      if (currentParams.get('ntk') && document.visibilityState === 'visible') {
        console.log('🔔 App: Polling detected notification token in URL');
        // URL params will be handled by the main useEffect
      }
    };

    const pollInterval = setInterval(pollForNotifications, 2000);

    // Verify service worker is ready
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        console.log('🔔 App: Service worker ready, all message listeners attached');
        
        // Send ready signal to service worker
        if (registration.active) {
          registration.active.postMessage({
            type: 'APP_READY',
            timestamp: Date.now()
          });
        }
      }).catch((error) => {
        console.warn('🔔 App: Service worker ready check failed:', error);
      });
    }

    // Cleanup on unmount
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
      window.removeEventListener('message', handleMessage);
      broadcastChannel?.close();
      clearInterval(pollInterval);
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