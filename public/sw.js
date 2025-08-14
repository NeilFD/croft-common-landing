// Service Worker for Croft App
// Handles caching, push notifications, and app communication

const CACHE_NAME = 'croft-v2';
const DEBUG_BYPASS = false; // Set to true to bypass all caching for troubleshooting

// Install event - immediately activate
self.addEventListener('install', event => {
  console.log('🔔 SW: Installing service worker');
  self.skipWaiting();
});

// Activate event - take control of clients
self.addEventListener('activate', event => {
  console.log('🔔 SW: Activating service worker');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🔔 SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - handle caching
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Bypass caching for debugging if enabled
  if (DEBUG_BYPASS) {
    console.log('🔔 SW: Debug bypass enabled, skipping cache');
    return;
  }

  const url = new URL(event.request.url);

  // Skip caching for brand assets to ensure they're always fresh
  if (url.pathname.includes('/brand/')) {
    return;
  }

  // Handle same-origin requests
  if (url.origin === self.location.origin) {
    // Dynamic images strategy (uploads): stale-while-revalidate
    if (url.pathname.startsWith('/lovable-uploads/')) {
      event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
          return cache.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            }).catch(() => cachedResponse);
            
            return cachedResponse || fetchPromise;
          });
        })
      );
      return;
    }

    // Built assets and other images: cache first with SWR
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
      event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
          return cache.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              // Serve from cache and update in background
              fetch(event.request).then(networkResponse => {
                cache.put(event.request, networkResponse.clone());
              }).catch(() => {});
              return cachedResponse;
            }
            
            // Not in cache, fetch and cache
            return fetch(event.request).then(networkResponse => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          });
        })
      );
    }
  }
});

// Push event - handle incoming push notifications
self.addEventListener('push', event => {
  console.log('🔔 SW: Push event received');
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('🔔 SW: Error parsing push data:', error);
  }

  const title = data.title || 'Croft Notification';
  const body = data.body || 'New notification';
  const icon = data.icon || '/brand/logo.png';
  
  const options = {
    body: body,
    icon: icon,
    badge: '/brand/logo.png',
    data: data,
    requireInteraction: true,
    actions: []
  };

  console.log('🔔 SW: Showing notification:', { title, options });

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', event => {
  console.log('🔔 SW: Notification clicked');
  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url;
  
  event.waitUntil((async () => {
    console.log('🔔 SW: Processing notification click with data:', data);

    // Enhanced storage for NUDGE button in multiple locations
    if (url) {
      console.log('🔔 SW: Storing NUDGE URL in multiple storage locations:', url);
      
      // Store in sessionStorage immediately for open PWA detection
      try {
        // Use storage API if available in service worker context
        if (typeof self.localStorage !== 'undefined') {
          self.sessionStorage.setItem('nudge_url', url);
          self.sessionStorage.setItem('nudge_data', JSON.stringify({ url, timestamp: Date.now() }));
          self.sessionStorage.removeItem('nudge_clicked');
          console.log('🔔 SW: NUDGE stored in sessionStorage');
        }
      } catch (error) {
        console.log('🔔 SW: sessionStorage not available in SW context:', error);
      }
      
      // Store in IndexedDB for persistence
      try {
        const request = indexedDB.open('nudge-storage', 1);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('nudge')) {
            db.createObjectStore('nudge', { keyPath: 'id' });
          }
        };
        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(['nudge'], 'readwrite');
          const store = transaction.objectStore('nudge');
          store.put({ id: 'current', url: url, timestamp: Date.now(), clicked: false });
          console.log('🔔 SW: NUDGE URL stored in IndexedDB successfully');
        };
      } catch (error) {
        console.error('🔔 SW: IndexedDB storage failed:', error);
      }
    }

    // Always open/focus the app first
    console.log('🔔 SW: Opening/focusing app window');
    let appWindow = null;
    
    // Try to focus existing window first
    const clients = await self.clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    });
    
    if (clients.length > 0) {
      appWindow = clients[0];
      await appWindow.focus();
      console.log('🔔 SW: Focused existing window');
    } else {
      // Open new window - always to the main app, not the notification URL
      appWindow = await self.clients.openWindow('/');
      console.log('🔔 SW: Opened new window');
    }
    
    // Enhanced NUDGE message delivery system for open PWA
    if (url) {
      console.log('🔔 SW: Preparing enhanced NUDGE delivery for URL:', url);
      
      // Store URL immediately via client messaging to reach open PWA sessionStorage
      const storeInClientStorage = async () => {
        try {
          const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
          console.log('🔔 SW: Found clients for storage messaging:', allClients.length);
          
          for (const client of allClients) {
            try {
              client.postMessage({
                type: 'STORE_NUDGE_URL',
                url: url,
                timestamp: Date.now()
              });
              console.log('🔔 SW: Sent storage message to client:', client.id);
            } catch (error) {
              console.error('🔔 SW: Failed to send storage message to client:', error);
            }
          }
        } catch (error) {
          console.error('🔔 SW: Failed to get clients for storage:', error);
        }
      };
      
      // Store immediately
      storeInClientStorage();
      
      // Enhanced NUDGE message delivery with aggressive retry system
      const sendEnhancedNudgeMessage = async (attempt = 1) => {
        const maxAttempts = 20; // Much more aggressive
        console.log(`🔔 SW: Enhanced NUDGE delivery attempt ${attempt}/${maxAttempts}`);
        
        if (attempt > maxAttempts) {
          console.log('🔔 SW: Max NUDGE delivery attempts reached');
          return;
        }
        
        try {
          // Get all available clients
          const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
          console.log(`🔔 SW: Attempt ${attempt} - Found ${allClients.length} clients`);
          
          // Method 1: BroadcastChannel (primary for open PWA)
          try {
            const nudgeChannel = new BroadcastChannel('nudge-notification');
            const nudgeMessage = {
              type: 'SHOW_NUDGE',
              url: url,
              timestamp: Date.now(),
              attempt: attempt,
              source: 'enhanced-broadcast'
            };
            
            nudgeChannel.postMessage(nudgeMessage);
            console.log(`🔔 SW: Enhanced BroadcastChannel message sent (attempt ${attempt}):`, nudgeMessage);
            nudgeChannel.close();
          } catch (error) {
            console.error('🔔 SW: BroadcastChannel failed:', error);
          }
          
          // Method 2: Direct client messaging
          for (const client of allClients) {
            try {
              client.postMessage({
                type: 'SHOW_NUDGE',
                url: url,
                timestamp: Date.now(),
                attempt: attempt,
                source: 'enhanced-client'
              });
              console.log(`🔔 SW: Enhanced client message sent to ${client.id} (attempt ${attempt})`);
            } catch (error) {
              console.error(`🔔 SW: Failed to message client ${client.id}:`, error);
            }
          }
          
          // Method 3: Specific window messaging if available
          if (appWindow && appWindow.postMessage) {
            try {
              appWindow.postMessage({
                type: 'SHOW_NUDGE',
                url: url,
                timestamp: Date.now(),
                attempt: attempt,
                source: 'enhanced-window'
              }, '*');
              console.log(`🔔 SW: Enhanced window message sent (attempt ${attempt})`);
            } catch (error) {
              console.error('🔔 SW: Window postMessage failed:', error);
            }
          }
          
          // Progressive retry strategy
          let delay;
          if (attempt <= 5) {
            delay = 300; // Quick retries for immediate response
          } else if (attempt <= 10) {
            delay = 1000; // Medium delay
          } else {
            delay = 2000; // Longer delay for persistence
          }
          
          setTimeout(() => sendEnhancedNudgeMessage(attempt + 1), delay);
          
        } catch (error) {
          console.error(`🔔 SW: Enhanced NUDGE delivery attempt ${attempt} failed:`, error);
          setTimeout(() => sendEnhancedNudgeMessage(attempt + 1), 1000);
        }
      };
      
      // Start enhanced delivery immediately
      sendEnhancedNudgeMessage(1);
      
      // Additional delayed attempts for focus scenarios
      setTimeout(() => {
        console.log('🔔 SW: Additional delivery wave for focus scenarios');
        sendEnhancedNudgeMessage(1);
      }, 3000);
      
      setTimeout(() => {
        console.log('🔔 SW: Final delivery wave for persistent open PWA');
        sendEnhancedNudgeMessage(1);
      }, 6000);
    }
  })());
});

// Message listener for app communication
self.addEventListener('message', (event) => {
  console.log('🔔 SW: Received message from client:', event.data);
  
  if (event.data?.type === 'APP_READY') {
    console.log('🔔 SW: ✅ App ready signal received', {
      timestamp: event.data.timestamp,
      url: event.data.url
    });
  }
});