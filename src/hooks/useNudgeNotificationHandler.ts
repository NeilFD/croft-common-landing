import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNudgeNotification } from '@/contexts/NudgeNotificationContext';

export const useNudgeNotificationHandler = () => {
  const { setNudgeUrl, nudgeUrl, nudgeClicked, clearNudge } = useNudgeNotification();
  const location = useLocation();

  useEffect(() => {
    console.log('🎯 NUDGE: Handler initializing...');
    
    // Simple check for nudge URL from storage
    const checkForNudgeUrl = () => {
      const storedNudgeUrl = sessionStorage.getItem('nudge_url');
      const wasClicked = sessionStorage.getItem('nudge_clicked') === 'true';
      
      if (storedNudgeUrl && !wasClicked) {
        console.log('🎯 NUDGE: Found URL in sessionStorage:', storedNudgeUrl);
        setNudgeUrl(storedNudgeUrl);
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
            if (result && result.url && !wasClicked) {
              console.log('🎯 NUDGE: Found URL in IndexedDB:', result.url);
              setNudgeUrl(result.url);
              sessionStorage.setItem('nudge_url', result.url);
            }
          };
        };
      } catch (error) {
        console.error('🎯 NUDGE: IndexedDB check failed:', error);
      }
    };
    
    checkForNudgeUrl();

    // Simple BroadcastChannel setup
    const channel = new BroadcastChannel('nudge-notification');
    
    const handleNudgeMessage = (event: MessageEvent) => {
      console.log('🎯 NUDGE: Received BroadcastChannel message:', event.data);
      if (event.data.type === 'SHOW_NUDGE' && event.data.url) {
        console.log('🎯 NUDGE: Setting URL from message:', event.data.url);
        setNudgeUrl(event.data.url);
        sessionStorage.setItem('nudge_url', event.data.url);
        sessionStorage.removeItem('nudge_clicked');
      }
    };

    channel.addEventListener('message', handleNudgeMessage);

    // Window message handling
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data.type === 'SHOW_NUDGE' && event.data.url) {
        console.log('🎯 NUDGE: Setting URL from window message:', event.data.url);
        setNudgeUrl(event.data.url);
        sessionStorage.setItem('nudge_url', event.data.url);
        sessionStorage.removeItem('nudge_clicked');
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

    // Check for nudge URL when page becomes visible or focused
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🎯 NUDGE: Page became visible, checking for URL...');
        checkForNudgeUrl();
      }
    };
    
    const handleFocus = () => {
      console.log('🎯 NUDGE: Window focused, checking for URL...');
      checkForNudgeUrl();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      channel.removeEventListener('message', handleNudgeMessage);
      window.removeEventListener('message', handleWindowMessage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      channel.close();
    };
  }, [setNudgeUrl]);

  // Simple clearing: clear nudge immediately when clicked + timeout backup
  useEffect(() => {
    if (nudgeClicked) {
      console.log('🎯 NUDGE: Button was clicked, clearing immediately');
      clearNudge();
      
      // Backup timeout clearing
      const timeoutId = setTimeout(() => {
        console.log('🎯 NUDGE: Timeout backup clearing');
        clearNudge();
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [nudgeClicked, clearNudge]);
};