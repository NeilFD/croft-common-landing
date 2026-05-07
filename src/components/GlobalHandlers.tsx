import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useConsolidatedPerformance } from '@/hooks/useConsolidatedPerformance';
import { useCapacitorDeepLinking } from '@/hooks/useCapacitorDeepLinking';
import { useCapacitorPushNotifications } from '@/hooks/useCapacitorPushNotifications';
import { useNudgeNotificationHandler } from '@/hooks/useNudgeNotificationHandler';
import { useTrackNotificationClick } from '@/hooks/useTrackNotificationClick';
import InteractionWatchdog from '@/components/InteractionWatchdog';

const GlobalHandlers = () => {
  const location = useLocation();

  useConsolidatedPerformance();
  useAnalytics();
  useNudgeNotificationHandler();
  useTrackNotificationClick();
  useCapacitorDeepLinking();
  useCapacitorPushNotifications();

  useEffect(() => {
    const logSessionStart = async () => {
      const { mobileLog } = await import('@/lib/mobileDebug');
      const { Capacitor } = await import('@capacitor/core');

      mobileLog('session_start', {
        route: location.pathname,
        platform: Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web',
        userAgent: navigator.userAgent.substring(0, 100),
      });
    };

    logSessionStart();
  }, []);

  return <InteractionWatchdog />;
};

export default GlobalHandlers;