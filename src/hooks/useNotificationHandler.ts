import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBannerNotification } from '@/contexts/BannerNotificationContext';

export const useNotificationHandler = () => {
  const { showBanner } = useBannerNotification();

  useEffect(() => {
    // Handle notification tokens from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const notificationToken = urlParams.get('ntk');
    const userId = urlParams.get('user');

    if (notificationToken) {
      console.log('🔔 App: Processing notification token from URL:', notificationToken);
      
      // Store in session storage for potential later use
      sessionStorage.setItem('notificationToken', notificationToken);
      
      // Track the notification open
      supabase.functions.invoke('track-notification-event', {
        body: {
          type: 'notification_open',
          token: notificationToken,
          url: window.location.href
        }
      }).then(() => {
        console.log('🔔 App: Notification open tracked');
      }).catch(error => {
        console.error('🔔 App: Failed to track notification open:', error);
      });
    }

    // Check database for pending banners
    const checkPendingBanners = async () => {
      const currentToken = notificationToken || sessionStorage.getItem('notificationToken');
      if (!currentToken) return;

      try {
        console.log('🔔 App: Checking database for pending banners with token:', currentToken);
        
        const { data: pendingBanners, error } = await supabase
          .from('pending_banners')
          .select('*')
          .eq('notification_token', currentToken)
          .eq('processed', false)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('🔔 App: Error fetching pending banners:', error);
          return;
        }

        if (pendingBanners && pendingBanners.length > 0) {
          const banner = pendingBanners[0];
          console.log('🔔 App: Found pending banner in database:', banner);
          
          showBanner({
            title: banner.title,
            body: banner.body,
            bannerMessage: banner.banner_message,
            url: banner.url,
            icon: banner.icon,
            notificationId: banner.id,
            clickToken: currentToken
          });

          // Mark as processed
          await supabase
            .from('pending_banners')
            .update({ processed: true, processed_at: new Date().toISOString() })
            .eq('id', banner.id);
        }
      } catch (error) {
        console.error('🔔 App: Error checking pending banners:', error);
      }
    };

    // Listen for BroadcastChannel messages (primary method)
    const channel = new BroadcastChannel('notification-events');
    const handleBroadcastMessage = (event: MessageEvent) => {
      console.log('🔔 App: Received broadcast message:', event.data);
      
      if (event.data?.type === 'SHOW_BANNER' && event.data?.data) {
        console.log('🔔 App: Showing banner from broadcast:', event.data.data);
        showBanner(event.data.data);
      }
    };

    channel.addEventListener('message', handleBroadcastMessage);
    
    // Check for pending banners immediately and on visibility/focus changes
    checkPendingBanners();
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔔 App: Page became visible, checking for pending banners');
        checkPendingBanners();
      }
    };
    
    const handleFocus = () => {
      console.log('🔔 App: Window focused, checking for pending banners');
      checkPendingBanners();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Send ready message to service worker
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'APP_READY' });
      console.log('🔔 App: Sent APP_READY to service worker');
    }

    // Cleanup
    return () => {
      channel.removeEventListener('message', handleBroadcastMessage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      channel.close();
    };
  }, [showBanner]);

  useEffect(() => {
    // Clean up URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const hasNotificationParams = urlParams.has('ntk') || urlParams.has('user');
    
    if (hasNotificationParams) {
      urlParams.delete('ntk');
      urlParams.delete('user');
      
      const newUrl = urlParams.toString() 
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      
      window.history.replaceState({}, '', newUrl);
      console.log('🔔 App: Cleaned notification params from URL');
    }
  }, []);
};