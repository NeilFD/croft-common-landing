import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNudgeNotification } from '@/contexts/NudgeNotificationContext';
import { useOptimizedPerformance } from './useOptimizedPerformance';

export const useNudgeNotificationHandler = () => {
  const { setNudgeUrl, nudgeUrl, nudgeClicked, clearNudge } = useNudgeNotification();
  const location = useLocation();
  const performance = useOptimizedPerformance();

  useEffect(() => {
    // Only initialize nudge handler after page is loaded
    if (!performance.isPageLoaded) return;
    console.log('🎯 NUDGE HANDLER: ================== INITIALIZING ==================');
    console.log('🎯 NUDGE HANDLER: Starting with context state:', { nudgeUrl, nudgeClicked });
    console.log('🎯 NUDGE HANDLER: Current route:', location.pathname);
    
    // Check for existing nudge URLs on handler initialization
    console.log('🎯 NUDGE HANDLER: Initializing - checking for existing notifications');
    console.log('🎯 NUDGE HANDLER: Current route:', location.pathname);
    
    // Enhanced IndexedDB initialization and checking
    const initializeAndCheckIndexedDB = () => {
      return new Promise<string | null>((resolve) => {
        console.log('🎯 NUDGE DB: ==================== STARTING DB INIT ====================');
        try {
          console.log('🎯 NUDGE DB: Opening IndexedDB connection...');
          const request = indexedDB.open('nudge-storage', 2);
          
          request.onerror = () => {
            console.error('🎯 NUDGE DB: ❌ IndexedDB open FAILED:', request.error);
            resolve(null);
          };
          
          request.onupgradeneeded = (event) => {
            console.log('🎯 NUDGE DB: 🔧 DATABASE UPGRADE NEEDED - creating store...');
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('nudge')) {
              db.createObjectStore('nudge');
              console.log('🎯 NUDGE DB: ✅ Created nudge object store in React app');
            } else {
              console.log('🎯 NUDGE DB: ℹ️ Nudge store already exists');
            }
          };
          
          request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            console.log('🎯 NUDGE DB: ✅ Database connection ESTABLISHED');
            console.log('🎯 NUDGE DB: Available object stores:', Array.from(db.objectStoreNames));
            
            if (!db.objectStoreNames.contains('nudge')) {
              console.error('🎯 NUDGE DB: ❌ No nudge store found in existing DB');
              resolve(null);
              return;
            }
            
            console.log('🎯 NUDGE DB: 🔍 Starting transaction to check for stored URLs...');
            // Check for current nudge URL
            const transaction = db.transaction(['nudge'], 'readonly');
            const store = transaction.objectStore('nudge');
            
            // Check both 'current' and 'delivery_pending' keys
            console.log('🎯 NUDGE DB: 📋 Checking both current and delivery_pending keys...');
            const getCurrentRequest = store.get('current');
            const getPendingRequest = store.get('delivery_pending');
            
            let currentResult = null;
            let pendingResult = null;
            let completedRequests = 0;
            
            const checkCompletion = () => {
              completedRequests++;
              console.log(`🎯 NUDGE DB: ✅ Request ${completedRequests}/2 completed`);
              console.log('🎯 NUDGE DB: Current result:', currentResult);
              console.log('🎯 NUDGE DB: Pending result:', pendingResult);
              
              if (completedRequests === 2) {
                // Prioritize pending delivery over current
                const result = pendingResult || currentResult;
                
                // Check if result is valid (not undefined objects from IndexedDB)
                const isValidResult = result && 
                  typeof result === 'object' && 
                  result.url && 
                  result.url !== 'undefined' &&
                  !(result._type === 'undefined' && result.value === 'undefined');
                
                if (isValidResult) {
                  console.log('🎯 NUDGE DB: 🎉 FOUND URL:', result.url, 
                    pendingResult ? '(from PENDING delivery)' : '(from CURRENT store)');
                  
                  // Clear pending delivery flag if we found one
                  if (pendingResult) {
                    try {
                      const clearTransaction = db.transaction(['nudge'], 'readwrite');
                      const clearStore = clearTransaction.objectStore('nudge');
                      clearStore.delete('delivery_pending');
                      console.log('🎯 NUDGE DB: ✅ Cleared pending delivery flag successfully');
                    } catch (error) {
                      console.error('🎯 NUDGE DB: ❌ Failed to clear pending flag:', error);
                    }
                  }
                  
                  resolve(result.url);
                } else {
                  console.log('🎯 NUDGE DB: 😔 NO URL found in either location');
                  resolve(null);
                }
              }
            };
            
            getCurrentRequest.onerror = () => {
              console.error('🎯 NUDGE DB: ❌ IndexedDB read FAILED for current key');
              checkCompletion();
            };
            
            getCurrentRequest.onsuccess = () => {
              currentResult = getCurrentRequest.result;
              console.log('🎯 NUDGE DB: ✅ Current key read SUCCESS:', currentResult);
              checkCompletion();
            };
            
            getPendingRequest.onerror = () => {
              console.error('🎯 NUDGE DB: ❌ IndexedDB read FAILED for pending key');
              checkCompletion();
            };
            
            getPendingRequest.onsuccess = () => {
              pendingResult = getPendingRequest.result;
              console.log('🎯 NUDGE DB: ✅ Pending key read SUCCESS:', pendingResult);
              checkCompletion();
            };
          };
        } catch (error) {
          console.error('🎯 NUDGE DB: ❌ IndexedDB initialization CATASTROPHIC FAILURE:', error);
          resolve(null);
        }
      });
    };
    
    // Check for nudge URL from both storage sources with detailed logging
    const checkForNudgeUrl = async () => {
      console.log('🎯 NUDGE CHECK: ================== CHECKING FOR NUDGE URL ==================');
      const wasClicked = sessionStorage.getItem('nudge_clicked') === 'true';
      console.log('🎯 NUDGE CHECK: Was already clicked?', wasClicked);
      
      if (wasClicked) {
        console.log('🎯 NUDGE CHECK: ❌ Already clicked, skipping all checks');
        return;
      }
      
      // Check sessionStorage first (fast)
      console.log('🎯 NUDGE CHECK: 🔍 Checking sessionStorage...');
      const storedNudgeUrl = sessionStorage.getItem('nudge_url');
      console.log('🎯 NUDGE CHECK: SessionStorage result:', storedNudgeUrl);
      
      if (storedNudgeUrl) {
        console.log('🎯 NUDGE CHECK: ✅ Found URL in sessionStorage:', storedNudgeUrl);
        setNudgeUrl(storedNudgeUrl);
        return;
      }
      
      // Check IndexedDB with initialization (slower but persistent)
      console.log('🎯 NUDGE CHECK: 🔍 Checking IndexedDB with initialization...');
      const indexedDBUrl = await initializeAndCheckIndexedDB();
      console.log('🎯 NUDGE CHECK: IndexedDB result:', indexedDBUrl);
      
      if (indexedDBUrl) {
        console.log('🎯 NUDGE CHECK: ✅ Setting URL from IndexedDB:', indexedDBUrl);
        setNudgeUrl(indexedDBUrl);
        sessionStorage.setItem('nudge_url', indexedDBUrl);
      } else {
        console.log('🎯 NUDGE CHECK: 😔 No URL found in any storage location');
      }
    };
    
    // Check for existing nudge URLs on initialization
    // checkForNudgeUrl(); // Removed - only check when messaged by SW

    // Robust BroadcastChannel setup with retry
    let channel: BroadcastChannel | null = null;
    let retryCount = 0;
    
    const setupBroadcastChannel = () => {
      console.log('🎯 NUDGE BC: ================== SETTING UP BROADCAST CHANNEL ==================');
      console.log('🎯 NUDGE BC: BroadcastChannel supported?', 'BroadcastChannel' in window);
      try {
        channel = new BroadcastChannel('nudge-notification');
        console.log('🎯 NUDGE BC: ✅ BroadcastChannel created successfully');
        console.log('🎯 NUDGE BC: Channel name:', channel.name);
        
        channel.addEventListener('message', handleNudgeMessage);
        channel.addEventListener('messageerror', (error) => {
          console.error('🎯 NUDGE BC: ❌ BroadcastChannel message error:', error);
        });
        
        console.log('🎯 NUDGE BC: ✅ Event listeners attached');
        
        // Test the channel immediately
        setTimeout(() => {
          console.log('🎯 NUDGE BC: 🧪 Testing BroadcastChannel with test message...');
          try {
            // Check if channel exists and is not closed before posting
            if (channel && typeof channel.postMessage === 'function') {
              channel.postMessage({ type: 'TEST', source: 'react-app', timestamp: Date.now() });
              console.log('🎯 NUDGE BC: ✅ Test message sent successfully');
            } else {
              console.log('🎯 NUDGE BC: ⚠️ Channel not available for test message');
            }
          } catch (error) {
            console.error('🎯 NUDGE BC: ❌ Failed to send test message:', error);
            // If the channel failed, don't throw the error - just log it
          }
        }, 500);
        
      } catch (error) {
        console.error('🎯 NUDGE BC: ❌ BroadcastChannel setup failed:', error);
      }
    };
    
    const handleNudgeMessage = (event: MessageEvent) => {
      console.log('🎯 NUDGE MESSAGE: ================== RECEIVED MESSAGE ==================');
      console.log('🎯 NUDGE MESSAGE: Event data:', event.data);
      console.log('🎯 NUDGE MESSAGE: Message type:', event.data?.type);
      console.log('🎯 NUDGE MESSAGE: Message URL:', event.data?.url);
      console.log('🎯 NUDGE MESSAGE: Event origin:', event.origin);
      
      // Support both SHOW_NUDGE (main SW) and SW_NAVIGATE (mobile SW) messages
      const isValidMessage = (event.data.type === 'SHOW_NUDGE' && event.data.url) || 
                            (event.data.type === 'SW_NAVIGATE' && event.data.url);
      
      if (isValidMessage) {
        console.log(`🎯 NUDGE MESSAGE: ✅ Valid ${event.data.type} message received!`);
        const url = event.data.url;
        
        // Always set the URL immediately, regardless of app state
        console.log('🎯 NUDGE MESSAGE: Setting URL directly from message:', url);
        setNudgeUrl(url);
        sessionStorage.setItem('nudge_url', url);
        sessionStorage.removeItem('nudge_clicked');
        
        // Send confirmation back to service worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'NUDGE_RECEIVED',
            url: url,
            timestamp: Date.now()
          });
        }
      } else {
        console.log('🎯 NUDGE MESSAGE: ❌ Invalid or irrelevant message');
        console.log('🎯 NUDGE MESSAGE: Expected type: SHOW_NUDGE or SW_NAVIGATE, got:', event.data?.type);
        console.log('🎯 NUDGE MESSAGE: Expected URL, got:', event.data?.url);
      }
    };

    // Set up BroadcastChannel immediately for open PWAs
    setupBroadcastChannel();
    
    // Enhanced APP_READY signal with multiple confirmations
    const sendAppReadySignal = () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        console.log('🎯 NUDGE HANDLER: 📡 Sending APP_READY signal to service worker');
        navigator.serviceWorker.controller.postMessage({
          type: 'APP_READY',
          timestamp: Date.now(),
          url: window.location.href,
          hasListeners: {
            broadcastChannel: !!channel,
            serviceWorkerMessage: true,
            windowMessage: true
          }
        });
        console.log('🎯 NUDGE HANDLER: ✅ APP_READY signal sent with listener status');
      } else {
        console.log('🎯 NUDGE HANDLER: ❌ No service worker controller available for APP_READY');
      }
    };
    
    // Send initial APP_READY after a brief delay to ensure all listeners are set up
    setTimeout(sendAppReadySignal, 100);

    // Service Worker message handling - NEW! This catches direct postMessage from SW
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      console.log('🎯 NUDGE SW-MSG: ================== SERVICE WORKER MESSAGE ==================');
      console.log('🎯 NUDGE SW-MSG: Event data:', event.data);
      console.log('🎯 NUDGE SW-MSG: Event source:', event.source);
      console.log('🎯 NUDGE SW-MSG: Event origin:', event.origin);
      
      // Support both SHOW_NUDGE (main SW) and SW_NAVIGATE (mobile SW) messages  
      const isValidMessage = (event.data.type === 'SHOW_NUDGE' && event.data.url) || 
                            (event.data.type === 'SW_NAVIGATE' && event.data.url);
      
      if (isValidMessage) {
        console.log(`🎯 NUDGE SW-MSG: ✅ Valid ${event.data.type} SERVICE WORKER message received!`);
        const url = event.data.url;
        
        // Always set the URL immediately, regardless of app state
        console.log('🎯 NUDGE SW-MSG: Setting URL from service worker message:', url);
        setNudgeUrl(url);
        sessionStorage.setItem('nudge_url', url);
        sessionStorage.removeItem('nudge_clicked');
        
        // Send confirmation back to service worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'NUDGE_RECEIVED',
            url: url,
            timestamp: Date.now(),
            source: 'service-worker-listener'
          });
        }
      } else {
        console.log('🎯 NUDGE SW-MSG: ❌ Invalid or irrelevant service worker message');
        console.log('🎯 NUDGE SW-MSG: Expected type: SHOW_NUDGE or SW_NAVIGATE, got:', event.data?.type);
      }
    };

    // Window message handling with enhanced logging
    const handleWindowMessage = (event: MessageEvent) => {
      console.log('🎯 NUDGE WINDOW: ================== WINDOW MESSAGE ==================');
      console.log('🎯 NUDGE WINDOW: Event data:', event.data);
      console.log('🎯 NUDGE WINDOW: Event source:', event.source);
      console.log('🎯 NUDGE WINDOW: Event origin:', event.origin);
      
      // Support both SHOW_NUDGE (main SW) and SW_NAVIGATE (mobile SW) messages  
      const isValidMessage = (event.data.type === 'SHOW_NUDGE' && event.data.url) || 
                            (event.data.type === 'SW_NAVIGATE' && event.data.url);
      
      if (isValidMessage) {
        console.log(`🎯 NUDGE WINDOW: ✅ Valid ${event.data.type} window message received!`);
        const url = event.data.url;
        
        // Always set the URL immediately, regardless of app state
        console.log('🎯 NUDGE WINDOW: Setting URL from window message:', url);
        setNudgeUrl(url);
        sessionStorage.setItem('nudge_url', url);
        sessionStorage.removeItem('nudge_clicked');
        
        // Send confirmation back to service worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'NUDGE_RECEIVED',
            url: url,
            timestamp: Date.now(),
            source: 'window-listener'
          });
        }
      } else {
        console.log('🎯 NUDGE WINDOW: ❌ Invalid or irrelevant window message');
        console.log('🎯 NUDGE WINDOW: Expected type: SHOW_NUDGE or SW_NAVIGATE, got:', event.data?.type);
      }
    };
    
    // Add BOTH service worker AND window message listeners
    console.log('🎯 NUDGE SW-MSG: 📡 Adding service worker message listener');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      console.log('🎯 NUDGE SW-MSG: ✅ Service worker message listener added');
    } else {
      console.log('🎯 NUDGE SW-MSG: ❌ Service worker not supported');
    }
    
    console.log('🎯 NUDGE WINDOW: 📡 Adding window message listener');
    window.addEventListener('message', handleWindowMessage);
    console.log('🎯 NUDGE WINDOW: ✅ Window message listener added');

    // Debounced visibility change handler
    let visibilityTimeout: NodeJS.Timeout;
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🎯 NUDGE: 👁️ Page became visible, checking for fresh service worker messages...');
        
        // Debounce to avoid excessive checks
        if (visibilityTimeout) clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(() => {
          // Only check IndexedDB for fresh messages from service worker (not persistent storage)
          initializeAndCheckIndexedDB().then(url => {
            if (url && !nudgeUrl) {
              console.log('🎯 NUDGE: ✓ Found fresh URL from service worker:', url);
              setNudgeUrl(url);
              sessionStorage.setItem('nudge_url', url);
            }
          });
        }, 500);
      }
    };
    
    const handleFocus = () => {
      console.log('🎯 NUDGE: 🎯 Window focused, checking for fresh service worker messages...');
      
      // Recreate BroadcastChannel on focus (connection might be stale)
      if (channel) {
        channel.close();
      }
      setupBroadcastChannel();
      
      // Only check IndexedDB for fresh messages from service worker (not persistent storage)
      initializeAndCheckIndexedDB().then(url => {
        if (url && !nudgeUrl) {
          console.log('🎯 NUDGE: ✓ Focus found fresh URL from service worker:', url);
          setNudgeUrl(url);
          sessionStorage.setItem('nudge_url', url);
        }
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      console.log('🎯 NUDGE HANDLER: 🧹 Cleaning up event listeners...');
      
      if (channel) {
        channel.removeEventListener('message', handleNudgeMessage);
        channel.close();
      }
      
      // Clean up BOTH service worker and window message listeners
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
      window.removeEventListener('message', handleWindowMessage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [setNudgeUrl, performance.isPageLoaded]);

  // Navigation tracking: clear nudge when user navigates anywhere
  const [initialPath] = useState(location.pathname);
  
  useEffect(() => {
    if (!nudgeUrl || nudgeClicked) return;
    
    const currentPath = location.pathname;
    console.log('🎯 NUDGE NAV: Checking navigation - current path:', currentPath, 'initial path:', initialPath, 'nudge URL:', nudgeUrl);
    
    // Clear nudge if user navigated to any different internal path
    if (currentPath !== initialPath) {
      console.log('🎯 NUDGE NAV: ✅ User navigated away from initial page, clearing nudge');
      clearNudge();
    }
  }, [location.pathname, nudgeUrl, nudgeClicked, initialPath, clearNudge]);

  // Timer-based fallback clearing (10 minutes)
  useEffect(() => {
    if (!nudgeUrl || nudgeClicked) return;
    
    console.log('🎯 NUDGE NAV: Setting 10-minute timeout for nudge clearing');
    const clearTimer = setTimeout(() => {
      console.log('🎯 NUDGE NAV: ✅ Timeout reached, clearing nudge');
      clearNudge();
    }, 10 * 60 * 1000); // 10 minutes
    
    return () => clearTimeout(clearTimer);
  }, [nudgeUrl, nudgeClicked, clearNudge]);

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