// Service Worker for Croft App
// Handles caching, push notifications, and app communication

// Cache names for versioning
const CACHE_NAME = 'croft-app-v1.5';
const CMS_CACHE_NAME = 'cms-images-v1.0';

// Install event - cache essential assets
self.addEventListener('install', event => {
  console.log('🔔 SW: Installing optimized service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🔔 SW: Caching essential assets');
        return cache.addAll(['/']);
      })
      .then(() => {
        console.log('🔔 SW: Assets cached successfully');
        self.skipWaiting();
      })
      .catch((error) => {
        console.error('🔔 SW: Error caching assets:', error);
      })
  );
});

// Activate event - clean up old caches but preserve CMS cache
self.addEventListener('activate', event => {
  console.log('🔔 SW: Activating optimized service worker');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== CMS_CACHE_NAME) {
            console.log('🔔 SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('🔔 SW: Optimized service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - mobile-optimized caching strategy
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // NEVER cache Supabase API requests - let them go direct to network
  if (url.hostname.includes('supabase.') || 
      url.hostname.includes('supabase') || 
      url.pathname.includes('/functions/v1/') ||
      url.pathname.includes('/auth/v1/') ||
      url.pathname.includes('/rest/v1/') ||
      url.pathname.includes('/storage/v1/') ||
      url.pathname.includes('/uploads/') || 
      url.pathname.includes('/api/') ||
      url.search.includes('bypass-cache=true')) {
    console.log('🔔 SW: Bypassing cache for:', url.href);
    return;
  }
  // SPA navigation: always serve fresh index.html (network-first) for any route
  if (event.request.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith(
      fetch('/', { cache: 'no-cache' }).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('/')) || Response.error();
      })
    );
    return;
  }

  // Aggressive CMS image caching
  if (url.pathname.includes('cms_images') || 
      (url.search.includes('from=cms_images') && event.request.method === 'GET')) {
    event.respondWith(
      caches.open(CMS_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            // Serve from cache immediately, update in background
            fetch(event.request)
              .then(networkResponse => {
                if (networkResponse.status === 200) {
                  cache.put(event.request, networkResponse.clone());
                }
              })
              .catch(() => {}); // Silent fail
            return cachedResponse;
          }
          
          // Not in cache, fetch and cache
          return fetch(event.request).then(networkResponse => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Handle same-origin requests with mobile-friendly strategy
  if (url.origin === self.location.origin) {
    // Network-first for HTML pages (prevents stale app issues on mobile)
    if (url.pathname === '/' || url.pathname.endsWith('.html')) {
      event.respondWith(
        fetch(event.request, { cache: 'no-cache' }).then(networkResponse => {
          // Cache successful response for offline fallback
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {
          // Network failed - try cache as fallback
          return caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request) || Response.error();
          });
        })
      );
      return;
    }

    // Network-first for JS/CSS (prevents stale app bundle issues)
    if (url.pathname.match(/\.(js|css)$/)) {
      event.respondWith(
        fetch(event.request).then(networkResponse => {
          // Cache successful response
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {
          // Network failed - try cache as fallback
          return caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request);
          });
        })
      );
      return;
    }

    // Dynamic images strategy (uploads): network-first for fresh content
    if (url.pathname.startsWith('/lovable-uploads/')) {
      event.respondWith(
        fetch(event.request).then(networkResponse => {
          // Successfully fetched from network - cache and return
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        }).catch(() => {
          // Network failed - try cache as fallback
          return caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request);
          });
        })
      );
      return;
    }

    // Static assets (images, fonts): cache first
    if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
      event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
          return cache.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Not in cache, fetch and cache
            return fetch(event.request).then(networkResponse => {
              if (networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
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
  console.log('🔔 SW: Raw event data object:', event.data);
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
    console.log('🔔 SW: ✅ PARSED PUSH DATA:', JSON.stringify(data, null, 2));
    console.log('🔔 SW: 🎯 URL in push data:', data.url, typeof data.url);
    console.log('🔔 SW: 🎯 Click token in push data:', data.click_token || data.clickToken);
  } catch (error) {
    console.error('🔔 SW: ❌ Error parsing push data:', error);
    console.log('🔔 SW: Raw data text:', event.data ? event.data.text() : 'no data');
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
  const clickToken = data.click_token || data.clickToken || (typeof url === 'string' ? (() => { try { return new URL(url, self.location.origin).searchParams.get('ntk'); } catch { return null; } })() : null);
  const clickUser = data.user || (typeof url === 'string' ? (() => { try { return new URL(url, self.location.origin).searchParams.get('user'); } catch { return null; } })() : null);
  
  console.log('🔔 SW: 🎯 NOTIFICATION CLICK DATA INSPECTION:');
  console.log('🔔 SW: Raw notification data:', JSON.stringify(data, null, 2));
  console.log('🔔 SW: Extracted URL:', url, typeof url);
  console.log('🔔 SW: URL is valid?', Boolean(url && url.length > 0));
  
  event.waitUntil((async () => {
    console.log('🔔 SW: Processing notification click with validated data:', data);

    // Best-effort click tracking via Edge Function (idempotent)
    try {
      if (clickToken) {
        const trackUrl = `https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/track-notification-click?ntk=${encodeURIComponent(clickToken)}${clickUser ? `&user=${encodeURIComponent(clickUser)}` : ''}`;
        fetch(trackUrl, { method: 'GET', mode: 'cors' }).catch(() => {});
      }
    } catch (_) {}

    // If we have a tracking URL, navigate directly to it
    if (url && typeof url === 'string' && url.length > 0) {
      console.log('🔔 SW: 🎯 Opening tracking URL directly:', url);
      
      // Try to focus existing window first
      const clients = await self.clients.matchAll({ 
        type: 'window', 
        includeUncontrolled: true 
      });
      
      if (clients.length > 0) {
        // Navigate existing window to the tracking URL
        console.log('🔔 SW: Navigating existing window to tracking URL');
        clients[0].navigate(url);
        await clients[0].focus();
      } else {
        // Open new window directly to the tracking URL
        console.log('🔔 SW: Opening new window with tracking URL');
        await self.clients.openWindow(url);
      }
    } else {
      // Fallback: open app normally if no tracking URL
      console.log('🔔 SW: No tracking URL, opening app normally');
      
      const clients = await self.clients.matchAll({ 
        type: 'window', 
        includeUncontrolled: true 
      });
      
      if (clients.length > 0) {
        await clients[0].focus();
        console.log('🔔 SW: Focused existing window');
      } else {
        await self.clients.openWindow('/');
        console.log('🔔 SW: Opened new window');
      }
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
  console.log('🔔 SW: 🎯 URL VALIDATION:', {
    url: url,
    type: typeof url,
    length: url ? url.length : 0,
    isString: typeof url === 'string',
    isValid: Boolean(url && typeof url === 'string' && url.length > 0)
  });
  
  if (!url || typeof url !== 'string' || url.length === 0) {
    console.error('🔔 SW: ❌ INVALID URL - cannot store:', url);
    throw new Error('Invalid URL provided for storage');
  }
  
  try {
    const db = await ensureNudgeDatabase();
    console.log('🔔 SW: ✅ Database ready for storage operation');
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['nudge'], 'readwrite');
      const store = transaction.objectStore('nudge');
      
      const data = { 
        url, 
        timestamp: Date.now(),
        stored_by: 'service_worker',
        click_processed: false
      };
      
      console.log('🔔 SW: 💾 DATA TO STORE:', JSON.stringify(data, null, 2));
      
      // Store in both 'current' and 'delivery_pending' keys for reliability
      const putCurrent = store.put(data, 'current');
      const putPending = store.put({ ...data, pending_delivery: true }, 'delivery_pending');
      
      console.log('🔔 SW: 📤 Initiated storage operations for both keys');
      
      let completedOps = 0;
      const checkCompletion = () => {
        completedOps++;
        console.log(`🔔 SW: ✅ Storage operation ${completedOps}/2 completed`);
        if (completedOps === 2) {
          console.log('🔔 SW: ✅ URL stored in both current and pending slots successfully');
          console.log('🔔 SW: 📊 FINAL STORED DATA:', JSON.stringify(data, null, 2));
          resolve();
        }
      };
      
      putCurrent.onsuccess = () => {
        console.log('🔔 SW: ✅ Current key storage SUCCESS');
        checkCompletion();
      };
      putCurrent.onerror = () => {
        console.error('🔔 SW: ❌ Current store operation failed:', putCurrent.error);
        reject(putCurrent.error);
      };
      
      putPending.onsuccess = () => {
        console.log('🔔 SW: ✅ Pending key storage SUCCESS');
        checkCompletion();
      };
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

// Storage-first delivery with immediate messaging for open PWAs
async function attemptNudgeDelivery(url) {
  console.log('🔔 SW: 📡 Storage-first NUDGE delivery for URL:', url);
  
  // URL is already stored in IndexedDB at this point
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  const hasOpenClients = clients.length > 0;
  
  if (hasOpenClients) {
    console.log(`🔔 SW: 📡 Open PWA detected (${clients.length} clients) - sending immediate messages`);
    
    // Send immediate message
    sendNudgeToClients(url, hasOpenClients);
    
    // Send retry message after 1 second for reliability
    setTimeout(() => {
      console.log('🔔 SW: 🔄 Sending retry message for open PWA');
      sendNudgeToClients(url, hasOpenClients);
    }, 1000);
    
  } else {
    console.log('🔔 SW: 📡 No open clients - relying on IndexedDB for fresh app launch');
    sendNudgeToClients(url, hasOpenClients);
  }
  
  // React app can also find the URL via IndexedDB polling as backup
}

function sendNudgeToClients(url, hasOpenClients = false) {
  console.log(`🔔 SW: 📡 Sending nudge to clients (open clients: ${hasOpenClients}):`, url);
  
  const message = {
    type: 'SHOW_NUDGE',
    url: url,
    timestamp: Date.now(),
    hasOpenClients: hasOpenClients,
    delivery_method: 'smart_buffered'
  };
  
  console.log('🔔 SW: 📤 Message to send:', message);
  
  let broadcastSent = false;
  
  // Strategy 1: BroadcastChannel (primary for same-origin)
  try {
    const channel = new BroadcastChannel('nudge-notification');
    console.log('🔔 SW: 📡 Sending BroadcastChannel message:', message);
    channel.postMessage(message);
    console.log('🔔 SW: ✅ BroadcastChannel NUDGE message sent');
    channel.close();
    broadcastSent = true;
  } catch (error) {
    console.error('🔔 SW: ❌ BroadcastChannel failed:', error);
  }
  
  // Add retry for BroadcastChannel if no confirmation received
  if (broadcastSent && hasOpenClients) {
    setTimeout(() => {
      try {
        const retryChannel = new BroadcastChannel('nudge-notification');
        retryChannel.postMessage({...message, retry: true});
        console.log('🔔 SW: 🔄 BroadcastChannel retry sent');
        retryChannel.close();
      } catch (error) {
        console.error('🔔 SW: ❌ BroadcastChannel retry failed:', error);
      }
    }, 2000);
  }
  
  // Strategy 2: Direct client messaging (for active clients)
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
    console.log(`🔔 SW: 👥 Found ${clients.length} clients for direct NUDGE messaging`);
    
    if (clients.length === 0) {
      console.log('🔔 SW: ℹ️ No active clients found for NUDGE');
      return;
    }
    
    clients.forEach((client, index) => {
      try {
        const clientMessage = {
          ...message,
          client_index: index,
          client_id: client.id.substring(0, 8)
        };
        console.log(`🔔 SW: 📡 Sending direct message to client ${index}:`, clientMessage);
        client.postMessage(clientMessage);
        console.log(`🔔 SW: ✅ NUDGE message sent to client ${index}`);
      } catch (error) {
        console.error(`🔔 SW: ❌ Failed to send NUDGE to client ${index}:`, error);
      }
    });
  }).catch(error => {
    console.error('🔔 SW: ❌ Failed to get clients for NUDGE:', error);
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