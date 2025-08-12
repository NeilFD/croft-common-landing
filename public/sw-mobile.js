// Enhanced service worker with mobile optimizations
const CACHE_NAME = 'croft-mobile-v1';
const IMAGE_CACHE = 'images-mobile-v1';
const ASSET_CACHE = 'assets-mobile-v1';

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

self.addEventListener('notificationclick', (event) => {
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
  
  // Ensure the notification URL dominates navigation
  event.waitUntil((async () => {
    try {
      const opened = await clients.openWindow(targetUrl);
      if (opened) return;
    } catch (_) {
      // ignore
    }
  
    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (clientList.length > 0) {
      // Navigate an existing same-origin client if possible
      for (const client of clientList) {
        if (client.url && client.url.startsWith(self.location.origin) && 'navigate' in client) {
          await client.navigate(targetUrl);
          await client.focus();
          return;
        }
      }
      // As a fallback, just focus the first client
      await clientList[0].focus();
      return;
    }
  
    // Last resort
    await clients.openWindow(targetUrl);
  })());
});
