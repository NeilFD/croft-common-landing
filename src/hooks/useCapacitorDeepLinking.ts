import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

export const useCapacitorDeepLinking = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Dynamic import only on native platforms
    import(/* @vite-ignore */ '@capacitor/app').then(({ App: CapacitorApp }) => {

      // Handle app URL when app is opened via deep link
      const handleAppUrlOpen = (event: any) => {
        console.log('🔗 Deep link received:', event.url);
        
        try {
          const url = new URL(event.url);
          const pathname = url.pathname;
          const search = url.search;
          
          // Handle /from-notification deep links
          if (pathname === '/from-notification') {
            console.log('🔗 Navigating to from-notification with params:', search);
            navigate(`/from-notification${search}`, { replace: true });
          } else if (pathname && pathname !== '/') {
            // Handle other deep links
            console.log('🔗 Navigating to:', pathname + search);
            navigate(pathname + search, { replace: true });
          }
        } catch (error) {
          console.error('🔗 Error parsing deep link:', error);
        }
      };

      // Listen for URL open events
      CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen);

      // Check if app was launched with a URL
      CapacitorApp.getLaunchUrl().then(result => {
        if (result?.url) {
          console.log('🔗 App launched with URL:', result.url);
          handleAppUrlOpen({ url: result.url });
        }
      }).catch(console.error);

      return () => {
        CapacitorApp.removeAllListeners();
      };
    }).catch(console.error);
  }, [navigate]);
};