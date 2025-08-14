import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNudgeNotification } from '@/contexts/NudgeNotificationContext';

export const useNudgeNotificationHandler = () => {
  const { setNudgeUrl, nudgeUrl, nudgeClicked, clearNudge } = useNudgeNotification();
  const location = useLocation();

  useEffect(() => {
    console.log('🎯 NUDGE: Handler initializing...');
    
    // Robust IndexedDB checker with error handling
    const checkIndexedDB = () => {
      return new Promise<string | null>((resolve) => {
        try {
          const request = indexedDB.open('nudge-storage', 1);
          
          request.onerror = () => {
            console.error('🎯 NUDGE: IndexedDB open failed');
            resolve(null);
          };
          
          request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            
            if (!db.objectStoreNames.contains('nudge')) {
              console.log('🎯 NUDGE: No nudge store found');
              resolve(null);
              return;
            }
            
            const transaction = db.transaction(['nudge'], 'readonly');
            const store = transaction.objectStore('nudge');
            const getRequest = store.get('current');
            
            getRequest.onerror = () => {
              console.error('🎯 NUDGE: IndexedDB read failed');
              resolve(null);
            };
            
            getRequest.onsuccess = () => {
              const result = getRequest.result;
              if (result && result.url) {
                console.log('🎯 NUDGE: Found URL in IndexedDB:', result.url);
                resolve(result.url);
              } else {
                resolve(null);
              }
            };
          };
        } catch (error) {
          console.error('🎯 NUDGE: IndexedDB check failed:', error);
          resolve(null);
        }
      });
    };
    
    // Check for nudge URL from both storage sources
    const checkForNudgeUrl = async () => {
      const wasClicked = sessionStorage.getItem('nudge_clicked') === 'true';
      
      if (wasClicked) {
        console.log('🎯 NUDGE: Already clicked, skipping checks');
        return;
      }
      
      // Check sessionStorage first (fast)
      const storedNudgeUrl = sessionStorage.getItem('nudge_url');
      if (storedNudgeUrl) {
        console.log('🎯 NUDGE: Found URL in sessionStorage:', storedNudgeUrl);
        setNudgeUrl(storedNudgeUrl);
        return;
      }
      
      // Check IndexedDB (slower but persistent)
      const indexedDBUrl = await checkIndexedDB();
      if (indexedDBUrl) {
        console.log('🎯 NUDGE: Setting URL from IndexedDB:', indexedDBUrl);
        setNudgeUrl(indexedDBUrl);
        sessionStorage.setItem('nudge_url', indexedDBUrl);
      }
    };
    
    checkForNudgeUrl();

    // Robust BroadcastChannel setup with retry
    let channel: BroadcastChannel | null = null;
    let retryCount = 0;
    
    const setupBroadcastChannel = () => {
      try {
        channel = new BroadcastChannel('nudge-notification');
        console.log('🎯 NUDGE: BroadcastChannel created');
        
        channel.addEventListener('message', handleNudgeMessage);
        channel.addEventListener('messageerror', (error) => {
          console.error('🎯 NUDGE: BroadcastChannel message error:', error);
        });
        
      } catch (error) {
        console.error('🎯 NUDGE: BroadcastChannel setup failed:', error);
      }
    };
    
    const handleNudgeMessage = (event: MessageEvent) => {
      console.log('🎯 NUDGE: Received BroadcastChannel message:', event.data);
      if (event.data.type === 'SHOW_NUDGE' && event.data.url) {
        console.log('🎯 NUDGE: Setting URL from message:', event.data.url);
        setNudgeUrl(event.data.url);
        sessionStorage.setItem('nudge_url', event.data.url);
        sessionStorage.removeItem('nudge_clicked');
      }
    };

    setupBroadcastChannel();

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

    // Aggressive polling when page becomes visible or focused (open PWA fix)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🎯 NUDGE: Page became visible, checking for URL...');
        checkForNudgeUrl();
        
        // Aggressive polling for open PWAs that might have missed messages
        let pollCount = 0;
        const pollInterval = setInterval(async () => {
          pollCount++;
          console.log(`🎯 NUDGE: Visibility poll ${pollCount}/10`);
          await checkForNudgeUrl();
          
          if (pollCount >= 10) {
            clearInterval(pollInterval);
            console.log('🎯 NUDGE: Visibility polling complete');
          }
        }, 500);
      }
    };
    
    const handleFocus = () => {
      console.log('🎯 NUDGE: Window focused, checking for URL...');
      checkForNudgeUrl();
      
      // Recreate BroadcastChannel on focus (connection might be stale)
      if (channel) {
        channel.close();
      }
      setupBroadcastChannel();
      
      // Aggressive polling for open PWAs
      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        pollCount++;
        console.log(`🎯 NUDGE: Focus poll ${pollCount}/5`);
        await checkForNudgeUrl();
        
        if (pollCount >= 5) {
          clearInterval(pollInterval);
          console.log('🎯 NUDGE: Focus polling complete');
        }
      }, 1000);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (channel) {
        channel.removeEventListener('message', handleNudgeMessage);
        channel.close();
      }
      window.removeEventListener('message', handleWindowMessage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
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