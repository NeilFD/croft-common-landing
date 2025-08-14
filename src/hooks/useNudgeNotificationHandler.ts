import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNudgeNotification } from '@/contexts/NudgeNotificationContext';

export const useNudgeNotificationHandler = () => {
  const { setNudgeUrl, nudgeUrl, clearNudge } = useNudgeNotification();
  const location = useLocation();

  useEffect(() => {
    // Check for existing nudge URL in sessionStorage on mount
    const storedNudgeUrl = sessionStorage.getItem('nudge_url');
    if (storedNudgeUrl) {
      setNudgeUrl(storedNudgeUrl);
    }

    // Listen for nudge messages from service worker
    const channel = new BroadcastChannel('nudge-notification');
    
    const handleNudgeMessage = (event: MessageEvent) => {
      if (event.data.type === 'SHOW_NUDGE' && event.data.url) {
        console.log('Received SHOW_NUDGE message:', event.data.url);
        setNudgeUrl(event.data.url);
      }
    };

    channel.addEventListener('message', handleNudgeMessage);

    // Send app ready message to service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({ type: 'APP_READY' });
        }
      });
    }

    return () => {
      channel.removeEventListener('message', handleNudgeMessage);
      channel.close();
    };
  }, [setNudgeUrl]);

  // Clear nudge when navigating away from the target URL
  useEffect(() => {
    if (nudgeUrl) {
      const targetPath = new URL(nudgeUrl, window.location.origin).pathname;
      const currentPath = location.pathname;
      
      // If we're not on the target path anymore, clear the nudge
      if (currentPath !== targetPath && !nudgeUrl.startsWith('http')) {
        clearNudge();
      }
    }
  }, [location.pathname, nudgeUrl, clearNudge]);
};