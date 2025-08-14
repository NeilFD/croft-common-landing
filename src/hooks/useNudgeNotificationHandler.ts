import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNudgeNotification } from '@/contexts/NudgeNotificationContext';

export const useNudgeNotificationHandler = () => {
  const { setNudgeUrl, nudgeUrl, nudgeClicked, clearNudge } = useNudgeNotification();
  const location = useLocation();

  useEffect(() => {
    console.log('🎯 NUDGE: Handler initializing with aggressive checking...');
    
    // Aggressive check for nudge URL from multiple sources
    const aggressiveNudgeCheck = async () => {
      console.log('🎯 NUDGE: Aggressive checking for stored URL...');
      
      // Check sessionStorage first with multiple keys
      const storedNudgeUrl = sessionStorage.getItem('nudge_url');
      const nudgeData = sessionStorage.getItem('nudge_data');
      const wasClicked = sessionStorage.getItem('nudge_clicked') === 'true';
      
      console.log('🎯 NUDGE: Storage state:', { storedNudgeUrl, nudgeData, wasClicked });
      
      if (storedNudgeUrl && !wasClicked) {
        console.log('🎯 NUDGE: Found URL in sessionStorage:', storedNudgeUrl);
        setNudgeUrl(storedNudgeUrl);
        return true;
      } else if (nudgeData && !wasClicked) {
        try {
          const parsed = JSON.parse(nudgeData);
          if (parsed.url) {
            console.log('🎯 NUDGE: Found URL in nudge_data:', parsed.url);
            setNudgeUrl(parsed.url);
            return true;
          }
        } catch (error) {
          console.error('🎯 NUDGE: Failed to parse nudge_data:', error);
        }
      } else if ((storedNudgeUrl || nudgeData) && wasClicked) {
        console.log('🎯 NUDGE: URL was already clicked, clearing all storage');
        sessionStorage.removeItem('nudge_url');
        sessionStorage.removeItem('nudge_data');
        sessionStorage.removeItem('nudge_clicked');
        return false;
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
    
    aggressiveNudgeCheck();

    // Enhanced BroadcastChannel setup with multiple channels
    let channel = new BroadcastChannel('nudge-notification');
    
    const handleNudgeMessage = (event: MessageEvent) => {
      console.log('🎯 NUDGE: Received enhanced BroadcastChannel message:', event.data);
      if (event.data.type === 'SHOW_NUDGE' && event.data.url) {
        console.log('🎯 NUDGE: Setting URL from enhanced message:', event.data.url, 'source:', event.data.source);
        setNudgeUrl(event.data.url);
        // Also store in sessionStorage for persistence
        sessionStorage.setItem('nudge_url', event.data.url);
        sessionStorage.removeItem('nudge_clicked');
      }
    };

    const setupChannel = () => {
      if (channel) {
        channel.removeEventListener('message', handleNudgeMessage);
        channel.close();
      }
      channel = new BroadcastChannel('nudge-notification');
      channel.addEventListener('message', handleNudgeMessage);
      console.log('🎯 NUDGE: Enhanced BroadcastChannel setup complete');
    };

    setupChannel();

    // Enhanced window message handling with storage support
    const handleWindowMessage = (event: MessageEvent) => {
      console.log('🎯 NUDGE: Received enhanced window message:', event.data);
      
      // Handle storage messages from service worker
      if (event.data.type === 'STORE_NUDGE_URL' && event.data.url) {
        console.log('🎯 NUDGE: Storing URL from service worker:', event.data.url);
        sessionStorage.setItem('nudge_url', event.data.url);
        sessionStorage.setItem('nudge_data', JSON.stringify({ url: event.data.url, timestamp: event.data.timestamp }));
        sessionStorage.removeItem('nudge_clicked');
        // Immediately trigger aggressive check
        setTimeout(() => aggressiveNudgeCheck(), 100);
      }
      
      // Handle show nudge messages
      if ((event.data.type === 'SET_NUDGE_URL' || event.data.type === 'SHOW_NUDGE') && event.data.url) {
        console.log('🎯 NUDGE: Setting URL from enhanced window message:', event.data.url, 'source:', event.data.source);
        setNudgeUrl(event.data.url);
        // Store in sessionStorage
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

    // Enhanced visibility and focus event handlers for aggressive checking
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🎯 NUDGE: Page became visible, aggressive checking...');
        setupChannel(); // Re-establish channel
        setTimeout(() => aggressiveNudgeCheck(), 100);
        setTimeout(() => aggressiveNudgeCheck(), 500);
        setTimeout(() => aggressiveNudgeCheck(), 1000);
      }
    };
    
    const handleFocus = () => {
      console.log('🎯 NUDGE: Window focused, aggressive checking...');
      setupChannel(); // Re-establish channel
      setTimeout(() => aggressiveNudgeCheck(), 100);
      setTimeout(() => aggressiveNudgeCheck(), 500);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Aggressive periodic check for nudge URL (high frequency for open PWA)
    const aggressivePeriodicCheck = setInterval(() => {
      if (!document.hidden) {
        aggressiveNudgeCheck();
      }
    }, 500); // Very frequent for open PWA

    // Standard periodic check as backup
    const standardPeriodicCheck = setInterval(() => {
      const currentUrl = sessionStorage.getItem('nudge_url');
      const wasClicked = sessionStorage.getItem('nudge_clicked') === 'true';
      
      if (currentUrl && !nudgeUrl && !wasClicked) {
        console.log('🎯 NUDGE: Standard periodic check found URL:', currentUrl);
        setNudgeUrl(currentUrl);
      } else if (currentUrl && wasClicked) {
        console.log('🎯 NUDGE: Standard periodic check found clicked URL, clearing');
        sessionStorage.removeItem('nudge_url');
        sessionStorage.removeItem('nudge_data');
        sessionStorage.removeItem('nudge_clicked');
      }
    }, 2000);

    return () => {
      channel.removeEventListener('message', handleNudgeMessage);
      window.removeEventListener('message', handleWindowMessage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      channel.close();
      clearInterval(aggressivePeriodicCheck);
      clearInterval(standardPeriodicCheck);
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