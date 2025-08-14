import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNudgeNotification } from '@/contexts/NudgeNotificationContext';

export const useNudgeNotificationHandler = () => {
  const { setNudgeUrl, nudgeUrl, clearNudge } = useNudgeNotification();
  const location = useLocation();

  useEffect(() => {
    console.log('🎯 NUDGE: Handler initializing...');
    
    // Check multiple sources for nudge URL on mount
    const checkForNudgeUrl = async () => {
      console.log('🎯 NUDGE: Checking for stored URL...');
      
      // Check sessionStorage first
      const storedNudgeUrl = sessionStorage.getItem('nudge_url');
      if (storedNudgeUrl) {
        console.log('🎯 NUDGE: Found URL in sessionStorage:', storedNudgeUrl);
        setNudgeUrl(storedNudgeUrl);
        return;
      }
      
      // Check IndexedDB for persistence
      try {
        const request = indexedDB.open('nudge-storage', 1);
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['nudge'], 'readonly');
          const store = transaction.objectStore('nudge');
          const getRequest = store.get('current');
          
          getRequest.onsuccess = () => {
            const result = getRequest.result;
            if (result && result.url) {
              console.log('🎯 NUDGE: Found URL in IndexedDB:', result.url);
              setNudgeUrl(result.url);
              // Also store in sessionStorage for quick access
              sessionStorage.setItem('nudge_url', result.url);
            }
          };
        };
      } catch (error) {
        console.error('🎯 NUDGE: IndexedDB check failed:', error);
      }
    };
    
    checkForNudgeUrl();

    // Listen for nudge messages from service worker
    const channel = new BroadcastChannel('nudge-notification');
    
    const handleNudgeMessage = (event: MessageEvent) => {
      console.log('🎯 NUDGE: Received BroadcastChannel message:', event.data);
      if (event.data.type === 'SHOW_NUDGE' && event.data.url) {
        console.log('🎯 NUDGE: Setting URL from message:', event.data.url);
        setNudgeUrl(event.data.url);
      }
    };

    channel.addEventListener('message', handleNudgeMessage);

    // Listen for direct window messages as backup
    const handleWindowMessage = (event: MessageEvent) => {
      console.log('🎯 NUDGE: Received window message:', event.data);
      if (event.data.type === 'SET_NUDGE_URL' && event.data.url) {
        console.log('🎯 NUDGE: Setting URL from window message:', event.data.url);
        setNudgeUrl(event.data.url);
      }
    };
    
    window.addEventListener('message', handleWindowMessage);

    // Send app ready message to service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({ 
            type: 'APP_READY',
            timestamp: Date.now(),
            url: window.location.href
          });
          console.log('🎯 NUDGE: Sent APP_READY to service worker');
        }
      });
    }

    // Periodic check for nudge URL (fallback)
    const periodicCheck = setInterval(() => {
      const currentUrl = sessionStorage.getItem('nudge_url');
      if (currentUrl && !nudgeUrl) {
        console.log('🎯 NUDGE: Periodic check found URL:', currentUrl);
        setNudgeUrl(currentUrl);
      }
    }, 2000);

    return () => {
      channel.removeEventListener('message', handleNudgeMessage);
      window.removeEventListener('message', handleWindowMessage);
      channel.close();
      clearInterval(periodicCheck);
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