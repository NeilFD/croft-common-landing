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

    // Store the URL for NUDGE button in IndexedDB for persistence
    if (url) {
      console.log('🔔 SW: Storing NUDGE URL in IndexedDB:', url);
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
          store.put({ id: 'current', url: url, timestamp: Date.now() });
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
    
    // Send NUDGE message after ensuring app is ready
    if (url) {
      console.log('🔔 SW: Preparing to send NUDGE message for URL:', url);
      
      // Send NUDGE message with multiple retry attempts
      const sendNudgeMessage = async (attempt = 1) => {
        console.log(`🔔 SW: Sending NUDGE message (attempt ${attempt})`);
        
        try {
          const nudgeChannel = new BroadcastChannel('nudge-notification');
          const nudgeMessage = {
            type: 'SHOW_NUDGE',
            url: url,
            timestamp: Date.now(),
            attempt: attempt
          };
          
          nudgeChannel.postMessage(nudgeMessage);
          console.log('🔔 SW: NUDGE BroadcastChannel message sent:', nudgeMessage);
          nudgeChannel.close();
          
          // Also send to specific window if available
          if (appWindow && appWindow.postMessage) {
            appWindow.postMessage({
              type: 'SET_NUDGE_URL',
              url: url,
              timestamp: Date.now()
            }, '*');
            console.log('🔔 SW: NUDGE postMessage sent to window');
          }
          
        } catch (error) {
          console.error(`🔔 SW: NUDGE message attempt ${attempt} failed:`, error);
          
          // Retry up to 3 times with increasing delays
          if (attempt < 3) {
            setTimeout(() => sendNudgeMessage(attempt + 1), attempt * 1000);
          }
        }
      };
      
      // Send immediately and with delays to ensure delivery
      sendNudgeMessage(1);
      setTimeout(() => sendNudgeMessage(2), 1000);
      setTimeout(() => sendNudgeMessage(3), 3000);
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