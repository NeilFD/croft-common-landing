import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNudgeNotification } from '@/contexts/NudgeNotificationContext';

export const useNudgeNotificationHandler = () => {
  const { setNudgeUrl, nudgeUrl, nudgeClicked, clearNudge } = useNudgeNotification();
  const location = useLocation();

  useEffect(() => {
    console.log('🎯 NUDGE: Handler initializing...');
    
    // Enhanced IndexedDB initialization and checking
    const initializeAndCheckIndexedDB = () => {
      return new Promise<string | null>((resolve) => {
        try {
          console.log('🎯 NUDGE: Initializing IndexedDB connection...');
          const request = indexedDB.open('nudge-storage', 1);
          
          request.onerror = () => {
            console.error('🎯 NUDGE: ✗ IndexedDB open failed');
            resolve(null);
          };
          
          request.onupgradeneeded = (event) => {
            console.log('🎯 NUDGE: Creating nudge database in React app');
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('nudge')) {
              db.createObjectStore('nudge');
              console.log('🎯 NUDGE: ✓ Created nudge object store');
            }
          };
          
          request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            console.log('🎯 NUDGE: ✓ Database connection established');
            
            if (!db.objectStoreNames.contains('nudge')) {
              console.log('🎯 NUDGE: ✗ No nudge store found in existing DB');
              resolve(null);
              return;
            }
            
            // Check for current nudge URL
            const transaction = db.transaction(['nudge'], 'readonly');
            const store = transaction.objectStore('nudge');
            
            // Check both 'current' and 'delivery_pending' keys
            const getCurrentRequest = store.get('current');
            const getPendingRequest = store.get('delivery_pending');
            
            let currentResult = null;
            let pendingResult = null;
            let completedRequests = 0;
            
            const checkCompletion = () => {
              completedRequests++;
              if (completedRequests === 2) {
                // Prioritize pending delivery over current
                const result = pendingResult || currentResult;
                if (result && result.url) {
                  console.log('🎯 NUDGE: ✓ Found URL in IndexedDB:', result.url, 
                    pendingResult ? '(from pending)' : '(from current)');
                  
                  // Clear pending delivery flag if we found one
                  if (pendingResult) {
                    try {
                      const clearTransaction = db.transaction(['nudge'], 'readwrite');
                      const clearStore = clearTransaction.objectStore('nudge');
                      clearStore.delete('delivery_pending');
                      console.log('🎯 NUDGE: ✓ Cleared pending delivery flag');
                    } catch (error) {
                      console.error('🎯 NUDGE: ✗ Failed to clear pending flag:', error);
                    }
                  }
                  
                  resolve(result.url);
                } else {
                  console.log('🎯 NUDGE: No URL found in IndexedDB');
                  resolve(null);
                }
              }
            };
            
            getCurrentRequest.onerror = () => {
              console.error('🎯 NUDGE: ✗ IndexedDB read failed for current');
              checkCompletion();
            };
            
            getCurrentRequest.onsuccess = () => {
              currentResult = getCurrentRequest.result;
              checkCompletion();
            };
            
            getPendingRequest.onerror = () => {
              console.error('🎯 NUDGE: ✗ IndexedDB read failed for pending');
              checkCompletion();
            };
            
            getPendingRequest.onsuccess = () => {
              pendingResult = getPendingRequest.result;
              checkCompletion();
            };
          };
        } catch (error) {
          console.error('🎯 NUDGE: ✗ IndexedDB initialization failed:', error);
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
      
      // Check IndexedDB with initialization (slower but persistent)
      const indexedDBUrl = await initializeAndCheckIndexedDB();
      if (indexedDBUrl) {
        console.log('🎯 NUDGE: ✓ Setting URL from IndexedDB:', indexedDBUrl);
        setNudgeUrl(indexedDBUrl);
        sessionStorage.setItem('nudge_url', indexedDBUrl);
      } else {
        console.log('🎯 NUDGE: No URL found in any storage');
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

    // Enhanced visibility change handler with IndexedDB polling
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🎯 NUDGE: 👁️ Page became visible, starting enhanced checks...');
        checkForNudgeUrl();
        
        // Immediate IndexedDB check with initialization
        initializeAndCheckIndexedDB().then(url => {
          if (url && !nudgeUrl) {
            console.log('🎯 NUDGE: ✓ Found URL on visibility change:', url);
            setNudgeUrl(url);
            sessionStorage.setItem('nudge_url', url);
          }
        });
        
        // Aggressive polling for open PWAs that might have missed messages
        let pollCount = 0;
        const pollInterval = setInterval(async () => {
          pollCount++;
          console.log(`🎯 NUDGE: 🔍 Visibility poll ${pollCount}/8`);
          
          // Check both sessionStorage and IndexedDB each poll
          await checkForNudgeUrl();
          const directUrl = await initializeAndCheckIndexedDB();
          if (directUrl && !nudgeUrl) {
            console.log(`🎯 NUDGE: ✓ Poll ${pollCount} found URL:`, directUrl);
            setNudgeUrl(directUrl);
            sessionStorage.setItem('nudge_url', directUrl);
            clearInterval(pollInterval);
            return;
          }
          
          if (pollCount >= 8) {
            clearInterval(pollInterval);
            console.log('🎯 NUDGE: 🏁 Visibility polling complete');
          }
        }, 750);
      }
    };
    
    const handleFocus = () => {
      console.log('🎯 NUDGE: 🎯 Window focused, starting enhanced recovery...');
      checkForNudgeUrl();
      
      // Recreate BroadcastChannel on focus (connection might be stale)
      if (channel) {
        channel.close();
      }
      setupBroadcastChannel();
      
      // Immediate deep IndexedDB check
      initializeAndCheckIndexedDB().then(url => {
        if (url && !nudgeUrl) {
          console.log('🎯 NUDGE: ✓ Focus found URL in IndexedDB:', url);
          setNudgeUrl(url);
          sessionStorage.setItem('nudge_url', url);
        }
      });
      
      // Enhanced polling for open PWAs with database initialization
      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        pollCount++;
        console.log(`🎯 NUDGE: 🔄 Focus poll ${pollCount}/6`);
        
        // Check both storage methods
        await checkForNudgeUrl();
        const dbUrl = await initializeAndCheckIndexedDB();
        if (dbUrl && !nudgeUrl) {
          console.log(`🎯 NUDGE: ✓ Focus poll ${pollCount} found URL:`, dbUrl);
          setNudgeUrl(dbUrl);
          sessionStorage.setItem('nudge_url', dbUrl);
          clearInterval(pollInterval);
          return;
        }
        
        if (pollCount >= 6) {
          clearInterval(pollInterval);
          console.log('🎯 NUDGE: 🏁 Focus polling complete');
        }
      }, 1200);
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