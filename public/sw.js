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
    
    // Simplified NUDGE message delivery for open PWA
    if (url) {
      console.log('🔔 SW: Sending NUDGE for URL:', url);
      
      // Single, reliable BroadcastChannel message + sessionStorage store
      const sendNudgeMessage = async () => {
        try {
          // Method 1: BroadcastChannel (primary)
          const nudgeChannel = new BroadcastChannel('nudge-notification');
          nudgeChannel.postMessage({
            type: 'SHOW_NUDGE',
            url: url,
            timestamp: Date.now()
          });
          console.log('🔔 SW: BroadcastChannel NUDGE sent');
          nudgeChannel.close();
          
          // Method 2: Direct client messaging for open PWAs
          const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
          for (const client of allClients) {
            client.postMessage({
              type: 'SHOW_NUDGE',
              url: url,
              timestamp: Date.now()
            });
          }
          console.log(`🔔 SW: Client messages sent to ${allClients.length} clients`);
          
        } catch (error) {
          console.error('🔔 SW: NUDGE message delivery failed:', error);
        }
      };
      
      // Send immediately and once more after a short delay
      sendNudgeMessage();
      setTimeout(sendNudgeMessage, 1000);
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