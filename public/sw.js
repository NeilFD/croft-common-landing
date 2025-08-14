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

    // Robust IndexedDB storage for NUDGE notifications
    if (url) {
      console.log('🔔 SW: 💾 Storing NUDGE URL with robust strategy:', url);
      
      try {
        await storeNudgeUrl(url);
        console.log('🔔 SW: ✅ NUDGE URL stored successfully');
      } catch (error) {
        console.error('🔔 SW: ❌ NUDGE URL storage failed:', error);
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
    
    // Simple NUDGE message delivery - storage-first approach
    if (url) {
      console.log('🔔 SW: 📡 Starting NUDGE delivery for URL:', url);
      
      // Store URL first
      await storeNudgeUrl(url);
      
      // Send immediately after storage
      console.log('🔔 SW: 📡 Sending NUDGE message immediately');
      sendNudgeToClients(url, 1);
    }
  })());
});

// Robust IndexedDB initialization and storage functions
async function ensureNudgeDatabase() {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('nudge-storage', 2);
      
      request.onerror = () => {
        console.error('🔔 SW: ❌ IndexedDB open failed:', request.error);
        reject(request.error);
      };
      
      request.onupgradeneeded = (event) => {
        console.log('🔔 SW: 🔧 Creating/upgrading nudge database');
        const db = event.target.result;
        if (!db.objectStoreNames.contains('nudge')) {
          const store = db.createObjectStore('nudge');
          console.log('🔔 SW: ✅ Created nudge object store');
        }
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        console.log('🔔 SW: ✅ Database connection established');
        resolve(db);
      };
    } catch (error) {
      console.error('🔔 SW: ❌ Database setup failed:', error);
      reject(error);
    }
  });
}

async function storeNudgeUrl(url) {
  console.log('🔔 SW: 📝 Starting robust nudge URL storage:', url);
  
  try {
    const db = await ensureNudgeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['nudge'], 'readwrite');
      const store = transaction.objectStore('nudge');
      
      const data = { 
        url, 
        timestamp: Date.now(),
        stored_by: 'service_worker',
        click_processed: false
      };
      
      // Store in both 'current' and 'delivery_pending' keys for reliability
      const putCurrent = store.put(data, 'current');
      const putPending = store.put({ ...data, pending_delivery: true }, 'delivery_pending');
      
      let completedOps = 0;
      const checkCompletion = () => {
        completedOps++;
        if (completedOps === 2) {
          console.log('🔔 SW: ✅ URL stored in both current and pending slots');
          resolve();
        }
      };
      
      putCurrent.onsuccess = checkCompletion;
      putCurrent.onerror = () => {
        console.error('🔔 SW: ❌ Current store operation failed:', putCurrent.error);
        reject(putCurrent.error);
      };
      
      putPending.onsuccess = checkCompletion;
      putPending.onerror = () => {
        console.error('🔔 SW: ❌ Pending store operation failed:', putPending.error);
        reject(putPending.error);
      };
      
      transaction.onerror = () => {
        console.error('🔔 SW: ❌ Transaction failed:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('🔔 SW: ❌ Storage operation failed:', error);
    throw error;
  }
}

// Exponential backoff delivery system
function attemptNudgeDelivery(url, attempt = 1) {
  const maxAttempts = 4;
  const delays = [1000, 3000, 6000, 10000]; // 1s, 3s, 6s, 10s
  
  console.log(`🔔 SW: 📡 NUDGE delivery attempt ${attempt}/${maxAttempts} for URL:`, url);
  
  sendNudgeToClients(url, attempt);
  
  if (attempt < maxAttempts) {
    const nextDelay = delays[attempt - 1] || 10000;
    console.log(`🔔 SW: ⏰ Scheduling next attempt in ${nextDelay}ms`);
    
    setTimeout(() => {
      attemptNudgeDelivery(url, attempt + 1);
    }, nextDelay);
  } else {
    console.log('🔔 SW: ⚠️ All NUDGE delivery attempts completed');
  }
}

function sendNudgeToClients(url, attempt = 1) {
  console.log(`🔔 SW: 📡 Sending nudge to clients (attempt ${attempt}):`, url);
  
  const message = {
    type: 'SHOW_NUDGE',
    url: url,
    timestamp: Date.now(),
    attempt: attempt,
    delivery_method: 'exponential_backoff'
  };
  
  // Strategy 1: BroadcastChannel (primary for same-origin)
  try {
    const channel = new BroadcastChannel('nudge-notification');
    channel.postMessage(message);
    console.log(`🔔 SW: ✅ BroadcastChannel message sent (attempt ${attempt})`);
    channel.close();
  } catch (error) {
    console.error(`🔔 SW: ❌ BroadcastChannel failed (attempt ${attempt}):`, error);
  }
  
  // Strategy 2: Direct client messaging (for active clients)
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
    console.log(`🔔 SW: 👥 Found ${clients.length} clients for direct messaging (attempt ${attempt})`);
    
    if (clients.length === 0) {
      console.log(`🔔 SW: ℹ️ No active clients found (attempt ${attempt})`);
      return;
    }
    
    clients.forEach((client, index) => {
      try {
        client.postMessage({
          ...message,
          client_index: index,
          client_id: client.id.substring(0, 8)
        });
        console.log(`🔔 SW: ✅ Message sent to client ${index} (attempt ${attempt})`);
      } catch (error) {
        console.error(`🔔 SW: ❌ Failed to send to client ${index} (attempt ${attempt}):`, error);
      }
    });
  }).catch(error => {
    console.error(`🔔 SW: ❌ Failed to get clients (attempt ${attempt}):`, error);
  });
}

// Global state for tracking app readiness and pending NUDGEs
let appReadyClients = new Set();
let pendingNudges = [];

// Message listener for app communication
self.addEventListener('message', (event) => {
  console.log('🔔 SW: Received message from client:', event.data);
  
  if (event.data?.type === 'APP_READY') {
    const clientId = event.source?.id || 'unknown';
    appReadyClients.add(clientId);
    
    console.log('🔔 SW: ✅ App ready signal received', {
      timestamp: event.data.timestamp,
      url: event.data.url,
      clientId: clientId.substring(0, 8),
      totalReadyClients: appReadyClients.size
    });
    
    // Send any pending NUDGEs to this newly ready client
    if (pendingNudges.length > 0) {
      console.log(`🔔 SW: 📤 Sending ${pendingNudges.length} pending NUDGEs to ready client`);
      pendingNudges.forEach(nudgeUrl => {
        try {
          event.source.postMessage({
            type: 'SHOW_NUDGE',
            url: nudgeUrl,
            timestamp: Date.now(),
            delivery_method: 'app_ready_delivery'
          });
          console.log('🔔 SW: ✅ Pending NUDGE sent:', nudgeUrl);
        } catch (error) {
          console.error('🔔 SW: ❌ Failed to send pending NUDGE:', error);
        }
      });
      // Clear pending NUDGEs after successful delivery
      pendingNudges = [];
    }
  }
  
  if (event.data?.type === 'NUDGE_RECEIVED') {
    console.log('🔔 SW: ✅ NUDGE received confirmation from client');
    // Remove from pending if it was there
    const url = event.data.url;
    pendingNudges = pendingNudges.filter(pendingUrl => pendingUrl !== url);
  }
});