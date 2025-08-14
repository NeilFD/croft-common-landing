// Enhanced service worker with mobile optimizations
const CACHE_NAME = 'croft-mobile-v1';
const IMAGE_CACHE = 'images-mobile-v1';
const ASSET_CACHE = 'assets-mobile-v1';
const NAV_CACHE = 'sw-nav-v1';
const NAV_INTENT_URL = '/__sw_nav_intent';

// Mobile-specific cache strategies
const MOBILE_MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB limit for mobile
const DESKTOP_MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB for desktop

// Detect mobile device
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
}

// Get appropriate cache size based on device
function getMaxCacheSize() {
  return isMobileDevice() ? MOBILE_MAX_CACHE_SIZE : DESKTOP_MAX_CACHE_SIZE;
}

// Enhanced cache management with size limits
async function manageCacheSize(cacheName) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  const maxSize = getMaxCacheSize();
  
  let totalSize = 0;
  const sizePromises = requests.map(async (request) => {
    const response = await cache.match(request);
    const size = response ? parseInt(response.headers.get('content-length') || '0') : 0;
    return { request, size };
  });
  
  const sizes = await Promise.all(sizePromises);
  sizes.sort((a, b) => b.size - a.size); // Sort by size, largest first
  
  for (const { request, size } of sizes) {
    totalSize += size;
    if (totalSize > maxSize) {
      await cache.delete(request);
    }
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old caches but keep our mobile-optimized ones
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.includes('mobile') && 
                !cacheName.includes(IMAGE_CACHE) && 
                !cacheName.includes(ASSET_CACHE)) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle GET requests
  if (request.method !== 'GET') return;
  
  // Skip bypass requests
  if (url.searchParams.has('sw-bypass')) return;
  
  // Enhanced mobile image caching with compression
  if (request.destination === 'image' || url.pathname.includes('/lovable-uploads/')) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const isMobile = url.searchParams.has('mobile');
        const shouldCompress = url.searchParams.has('compress') || isMobile;
        
        // Try cache first
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          // Update in background for mobile (stale-while-revalidate)
          if (isMobile) {
            fetch(request).then(response => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
            }).catch(() => {}); // Silent fail for background updates
          }
          return cachedResponse;
        }
        
        // Fetch with mobile optimizations
        try {
          const response = await fetch(request, {
            // Add mobile-specific headers
            headers: shouldCompress ? {
              'Accept': 'image/webp,image/avif,image/*,*/*;q=0.8',
              'Accept-Encoding': 'gzip, deflate, br'
            } : {}
          });
          
          if (response.ok) {
            // Cache successful responses
            cache.put(request, response.clone());
            
            // Manage cache size on mobile
            if (isMobile) {
              manageCacheSize(IMAGE_CACHE);
            }
          }
          
          return response;
        } catch (error) {
          // Return cached version if available, even if stale
          return cachedResponse || new Response('Image not available', { status: 404 });
        }
      })
    );
    return;
  }
  
  // Cache built assets with mobile optimization
  if (url.origin === self.location.origin && 
      (url.pathname.startsWith('/assets/') || 
       url.pathname.endsWith('.js') || 
       url.pathname.endsWith('.css'))) {
    
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          return cachedResponse || new Response('Asset not available', { status: 404 });
        }
      })
    );
  }
});

// Handle push notifications with mobile-specific optimizations
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const isMobile = isMobileDevice();
    
    // Mobile-optimized notification options
    const options = {
      body: data.body || 'New notification',
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: {
        url: data.url || '/',
        click_token: data.click_token || data.clickToken
      },
      // Mobile-specific options
      vibrate: isMobile ? [200, 100, 200] : undefined,
      requireInteraction: !isMobile, // Auto-dismiss on mobile to save battery
      silent: false
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Croft Common', options)
    );
  } catch (error) {
    console.warn('Push notification error:', error);
  }
});

// Robust IndexedDB initialization and storage functions for NUDGE
async function ensureNudgeDatabase() {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('nudge-storage', 2);
      
      request.onerror = () => {
        console.error('🔔 SW-MOBILE: ❌ IndexedDB open failed:', request.error);
        reject(request.error);
      };
      
      request.onupgradeneeded = (event) => {
        console.log('🔔 SW-MOBILE: 🔧 Creating/upgrading nudge database');
        const db = event.target.result;
        if (!db.objectStoreNames.contains('nudge')) {
          const store = db.createObjectStore('nudge');
          console.log('🔔 SW-MOBILE: ✅ Created nudge object store');
        }
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        console.log('🔔 SW-MOBILE: ✅ Database connection established');
        resolve(db);
      };
    } catch (error) {
      console.error('🔔 SW-MOBILE: ❌ Database setup failed:', error);
      reject(error);
    }
  });
}

async function storeNudgeUrl(url) {
  console.log('🔔 SW-MOBILE: 📝 Starting robust nudge URL storage:', url);
  
  try {
    const db = await ensureNudgeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['nudge'], 'readwrite');
      const store = transaction.objectStore('nudge');
      
      const data = { 
        url, 
        timestamp: Date.now(),
        stored_by: 'mobile_service_worker',
        click_processed: false
      };
      
      // Store in both 'current' and 'delivery_pending' keys for reliability
      const putCurrent = store.put(data, 'current');
      const putPending = store.put({ ...data, pending_delivery: true }, 'delivery_pending');
      
      let completedOps = 0;
      const checkCompletion = () => {
        completedOps++;
        if (completedOps === 2) {
          console.log('🔔 SW-MOBILE: ✅ URL stored in both current and pending slots');
          resolve();
        }
      };
      
      putCurrent.onsuccess = checkCompletion;
      putCurrent.onerror = () => {
        console.error('🔔 SW-MOBILE: ❌ Current store operation failed:', putCurrent.error);
        reject(putCurrent.error);
      };
      
      putPending.onsuccess = checkCompletion;
      putPending.onerror = () => {
        console.error('🔔 SW-MOBILE: ❌ Pending store operation failed:', putPending.error);
        reject(putPending.error);
      };
      
      transaction.onerror = () => {
        console.error('🔔 SW-MOBILE: ❌ Transaction failed:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('🔔 SW-MOBILE: ❌ Storage operation failed:', error);
    throw error;
  }
}

// Mobile-optimized smart delivery with buffering for open PWAs
async function attemptMobileNudgeDelivery(url) {
  console.log('🔔 SW-MOBILE: 📡 Starting mobile NUDGE delivery for URL:', url);
  
  // Check if any clients are open
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  const hasOpenClients = clients.length > 0;
  
  if (hasOpenClients) {
    console.log(`🔔 SW-MOBILE: ⏰ Open clients detected (${clients.length}), adding 500ms mobile buffer`);
    setTimeout(() => {
      sendNudgeToClients(url, hasOpenClients);
    }, 500);
  } else {
    console.log('🔔 SW-MOBILE: ⚡ No open clients, sending immediately');
    sendNudgeToClients(url, hasOpenClients);
  }
}

function sendNudgeToClients(url, hasOpenClients = false) {
  console.log(`🔔 SW-MOBILE: 📡 Sending nudge to clients (open clients: ${hasOpenClients}):`, url);
  
  const message = {
    type: 'SHOW_NUDGE',
    url: url,
    timestamp: Date.now(),
    hasOpenClients: hasOpenClients,
    delivery_method: 'mobile_smart_buffered'
  };
  
  let broadcastSent = false;
  
  // Strategy 1: BroadcastChannel (primary for same-origin)
  try {
    const channel = new BroadcastChannel('nudge-notification');
    channel.postMessage(message);
    console.log('🔔 SW-MOBILE: ✅ BroadcastChannel NUDGE message sent');
    channel.close();
    broadcastSent = true;
  } catch (error) {
    console.error('🔔 SW-MOBILE: ❌ BroadcastChannel failed:', error);
  }
  
  // Add retry for BroadcastChannel if no confirmation received
  if (broadcastSent && hasOpenClients) {
    setTimeout(() => {
      try {
        const retryChannel = new BroadcastChannel('nudge-notification');
        retryChannel.postMessage({...message, retry: true});
        console.log('🔔 SW-MOBILE: 🔄 BroadcastChannel retry sent');
        retryChannel.close();
      } catch (error) {
        console.error('🔔 SW-MOBILE: ❌ BroadcastChannel retry failed:', error);
      }
    }, 2000);
  }
  
  // Strategy 2: Direct client messaging (for active clients)
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
    console.log(`🔔 SW-MOBILE: 👥 Found ${clients.length} clients for direct NUDGE messaging`);
    
    if (clients.length === 0) {
      console.log('🔔 SW-MOBILE: ℹ️ No active clients found for NUDGE');
      return;
    }
    
    clients.forEach((client, index) => {
      try {
        client.postMessage({
          ...message,
          client_index: index,
          client_id: client.id.substring(0, 8)
        });
        console.log(`🔔 SW-MOBILE: ✅ NUDGE message sent to client ${index}`);
      } catch (error) {
        console.error(`🔔 SW-MOBILE: ❌ Failed to send NUDGE to client ${index}:`, error);
      }
    });
  }).catch(error => {
    console.error('🔔 SW-MOBILE: ❌ Failed to get clients for NUDGE:', error);
  });
}

self.addEventListener('notificationclick', (event) => {
  console.log('🔔 SW-MOBILE: Notification clicked');
  event.notification.close();
  
  const data = event.notification.data || {};
  let targetUrl = data.url || '/';
  
  // Normalize URL
  if (!String(targetUrl).startsWith('http')) {
    targetUrl = new URL(targetUrl, self.location.origin).href;
  }
  
  // Prefer snake_case token but support both
  const clickToken = data.click_token || data.clickToken;
  
  // Append click token for analytics if present
  if (clickToken) {
    const url = new URL(targetUrl);
    url.searchParams.set('ntk', clickToken);
    targetUrl = url.toString();
  }
  
  // Track click event
  if (clickToken) {
    fetch('/functions/v1/track-notification-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'notification_click', token: clickToken })
    }).catch(() => {}); // Silent fail
  }
  
  // Enhanced NUDGE functionality with mobile-optimized fallback
  event.waitUntil((async () => {
    console.log('🔔 SW-MOBILE: Processing notification click with NUDGE support:', data);

    // NUDGE: Store URL in IndexedDB for reliable retrieval
    if (targetUrl) {
      console.log('🔔 SW-MOBILE: 💾 Storing NUDGE URL:', targetUrl);
      
      try {
        await storeNudgeUrl(targetUrl);
        console.log('🔔 SW-MOBILE: ✅ NUDGE URL stored successfully');
      } catch (error) {
        console.error('🔔 SW-MOBILE: ❌ NUDGE URL storage failed:', error);
      }
    }

    // Persist navigation intent in Cache Storage for durable handoff (mobile compatibility)
    try {
      const cache = await caches.open(NAV_CACHE);
      await cache.put(NAV_INTENT_URL, new Response(
        JSON.stringify({ url: targetUrl, ts: Date.now(), clickToken }),
        { headers: { 'Content-Type': 'application/json' } }
      ));
    } catch (_) {}

    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });

    // NUDGE: Send NUDGE notification to all clients
    if (targetUrl) {
      console.log('🔔 SW-MOBILE: 📡 Sending NUDGE message for URL:', targetUrl);
      
      // Send with smart mobile delivery system
      attemptMobileNudgeDelivery(targetUrl);
    }

    // Mobile-optimized navigation fallback (keep existing behavior as backup)
    try {
      const bounceUrl = `/nav.html?to=${encodeURIComponent(targetUrl)}`;
      const opened = await clients.openWindow(bounceUrl);
      try { if (opened && 'focus' in opened) await opened.focus(); } catch (_) {}
    } catch (_) {}

    // Legacy broadcast for backward compatibility
    let bc = null;
    try { bc = new BroadcastChannel('nav-handoff-v1'); } catch (_) {}
    const broadcast = () => {
      try { bc && bc.postMessage({ type: 'SW_NAVIGATE', url: targetUrl }); } catch (_) {}
      for (const client of clientList) {
        try { client.postMessage({ type: 'SW_NAVIGATE', url: targetUrl }); } catch (_) {}
      }
    };
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));
    try {
      broadcast();
      await delay(200);
      broadcast();
      await delay(1000);
      broadcast();
    } catch (_) {} finally {
      try { bc && bc.close(); } catch (_) {}
    }

    // Done
    return;
  })());
});

// Global state for tracking mobile app readiness and pending NUDGEs
let mobileAppReadyClients = new Set();
let mobilePendingNudges = [];

// Message listener for app communication (NUDGE support)
self.addEventListener('message', (event) => {
  console.log('🔔 SW-MOBILE: Received message from client:', event.data);
  
  if (event.data?.type === 'APP_READY') {
    const clientId = event.source?.id || 'unknown';
    mobileAppReadyClients.add(clientId);
    
    console.log('🔔 SW-MOBILE: ✅ App ready signal received', {
      timestamp: event.data.timestamp,
      url: event.data.url,
      serviceWorker: 'mobile',
      clientId: clientId.substring(0, 8),
      totalReadyClients: mobileAppReadyClients.size
    });
    
    // Send any pending NUDGEs to this newly ready mobile client
    if (mobilePendingNudges.length > 0) {
      console.log(`🔔 SW-MOBILE: 📤 Sending ${mobilePendingNudges.length} pending NUDGEs to ready mobile client`);
      mobilePendingNudges.forEach(nudgeUrl => {
        try {
          event.source.postMessage({
            type: 'SHOW_NUDGE',
            url: nudgeUrl,
            timestamp: Date.now(),
            delivery_method: 'mobile_app_ready_delivery'
          });
          console.log('🔔 SW-MOBILE: ✅ Pending NUDGE sent:', nudgeUrl);
        } catch (error) {
          console.error('🔔 SW-MOBILE: ❌ Failed to send pending NUDGE:', error);
        }
      });
      // Clear pending NUDGEs after successful delivery
      mobilePendingNudges = [];
    }
  }
  
  if (event.data?.type === 'NUDGE_RECEIVED') {
    console.log('🔔 SW-MOBILE: ✅ NUDGE received confirmation from mobile client');
    // Remove from pending if it was there
    const url = event.data.url;
    mobilePendingNudges = mobilePendingNudges.filter(pendingUrl => pendingUrl !== url);
  }
});
