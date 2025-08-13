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

        // Listen for banner messages from service worker
        const handleServiceWorkerMessage = (event: MessageEvent) => {
          if (event.data?.type === 'SHOW_BANNER') {
            const bannerData = event.data.data;
            showBanner({
              title: bannerData.title || 'Notification',
              body: bannerData.body || '',
              bannerMessage: bannerData.banner_message,
              url: bannerData.url,
              icon: bannerData.icon,
              notificationId: bannerData.notification_id || '',
              clickToken: bannerData.click_token
            });
          }
        };

        navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

        // Cleanup listener on unmount
        return () => {
          navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
        };

        // Clean URL of notification parameters after tracking
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('ntk');
        newSearchParams.delete('user');
        
        const newUrl = `${location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}${location.hash}`;
        window.history.replaceState({}, '', newUrl);
        
      } catch (error) {
        console.warn('[NotificationHandler] Error processing notification:', error);
      }
    };

    handleNotificationTracking();
  }, [location.pathname, searchParams]);
};