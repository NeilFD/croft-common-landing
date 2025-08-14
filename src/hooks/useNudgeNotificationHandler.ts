import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNudgeNotification } from '@/contexts/NudgeNotificationContext';

export const useNudgeNotificationHandler = () => {
  const { setNudgeUrl, nudgeUrl, nudgeClicked, clearNudge } = useNudgeNotification();
  const location = useLocation();

  useEffect(() => {
    console.log('🎯 NUDGE: Handler initializing...');
    
    // Check multiple sources for nudge URL on mount
    const checkForNudgeUrl = async () => {
      console.log('🎯 NUDGE: Checking for stored URL...');
      
    // Check sessionStorage first
    const storedNudgeUrl = sessionStorage.getItem('nudge_url');
    const wasClicked = sessionStorage.getItem('nudge_clicked') === 'true';
    
    if (storedNudgeUrl && !wasClicked) {
      console.log('🎯 NUDGE: Found URL in sessionStorage:', storedNudgeUrl);
      setNudgeUrl(storedNudgeUrl);
      return;
    } else if (storedNudgeUrl && wasClicked) {
      console.log('🎯 NUDGE: URL was already clicked, clearing');
      sessionStorage.removeItem('nudge_url');
      sessionStorage.removeItem('nudge_clicked');
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

    // Periodic check for nudge URL (more frequent for open PWA)
    const periodicCheck = setInterval(() => {
      const currentUrl = sessionStorage.getItem('nudge_url');
      const wasClicked = sessionStorage.getItem('nudge_clicked') === 'true';
      
      if (currentUrl && !nudgeUrl && !wasClicked) {
        console.log('🎯 NUDGE: Periodic check found URL:', currentUrl);
        setNudgeUrl(currentUrl);
      } else if (currentUrl && wasClicked) {
        console.log('🎯 NUDGE: Periodic check found clicked URL, clearing');
        sessionStorage.removeItem('nudge_url');
        sessionStorage.removeItem('nudge_clicked');
      }
    }, 1000); // More frequent for open PWA

    return () => {
      channel.removeEventListener('message', handleNudgeMessage);
      window.removeEventListener('message', handleWindowMessage);
      channel.close();
      clearInterval(periodicCheck);
    };
  }, [setNudgeUrl]);

  // Clear nudge when it has been clicked and user navigates
  useEffect(() => {
    if (nudgeClicked && nudgeUrl) {
      console.log('🎯 NUDGE: Button was clicked, clearing after navigation');
      // Clear immediately if external URL (since user returned)
      if (nudgeUrl.startsWith('http')) {
        clearNudge();
      } else {
        // For internal URLs, clear when navigating away from target
        const targetPath = new URL(nudgeUrl, window.location.origin).pathname;
        const currentPath = location.pathname;
        if (currentPath !== targetPath) {
          clearNudge();
        }
      }
    }
  }, [location.pathname, nudgeUrl, nudgeClicked, clearNudge]);

  // Also clear on page visibility change if clicked (user returned from external URL)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && nudgeClicked && nudgeUrl?.startsWith('http')) {
        console.log('🎯 NUDGE: Page visible after external URL click, clearing');
        setTimeout(() => clearNudge(), 1000); // Small delay to ensure user has "returned"
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [nudgeClicked, nudgeUrl, clearNudge]);
};