/* Minimal service worker for PWA + Push */
const SUPABASE_URL = 'https://xccidvoxhpgcnwinnyin.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU';

const IMAGE_CACHE = 'images-v3';
const ASSET_CACHE = 'assets-swr-v3';

self.addEventListener('install', (event) => {
  // Activate immediately on install
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control and clean old caches
  event.waitUntil((async () => {
    await self.clients.claim();
    const keep = new Set([IMAGE_CACHE, ASSET_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => keep.has(k) ? null : caches.delete(k)));
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Allow explicit bypass for troubleshooting/retries
  if (url.searchParams.get('sw-bypass') === '1') {
    event.respondWith(fetch(req));
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;
  const isImage = /\.(?:png|jpg|jpeg|gif|webp|avif|svg)$/i.test(url.pathname);
  const isUploads = isSameOrigin && url.pathname.startsWith('/lovable-uploads/');
  const isBuiltAsset = isSameOrigin && url.pathname.startsWith('/assets/');
  const isBrand = isSameOrigin && url.pathname.startsWith('/brand/');

  // Never intercept brand assets - keep them deterministic
  if (isBrand) {
    event.respondWith(fetch(req));
    return;
  }

  // Stale-while-revalidate for dynamic images (uploads)
  if (isImage && isUploads) {
    event.respondWith((async () => {
      const cache = await caches.open(IMAGE_CACHE);
      const cached = await cache.match(req, { ignoreVary: true });
      const networkPromise = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);

      if (cached) {
        // Update in background
        networkPromise.catch(() => {});
        return cached;
      }

      const fresh = await networkPromise;
      if (fresh) return fresh;
      // No fabricated 504s; let the browser handle retries/placeholder
      return new Response('', { status: 204 });
    })());
    return;
  }

  // Cache-first with SWR for built assets and other same-origin images
  if (isBuiltAsset || (isImage && isSameOrigin)) {
    event.respondWith((async () => {
      const cache = await caches.open(ASSET_CACHE);
      const cached = await cache.match(req, { ignoreVary: true });
      const fetchPromise = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => cached || null);
      return cached || fetchPromise;
    })());
    return;
  }
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    // no-op
  }
  const title = data.title || 'Croft Common';
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    image: data.image || undefined,
    data: {
      url: data.url || '/',
      click_token: data.click_token || null,
      notification_id: data.notification_id || null,
      banner_message: data.banner_message || null,
      display_mode: data.display_mode || 'navigation',
    },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const normalize = (u) => {
    try {
      if (!u) return new URL('/', self.location.origin).href;
      if (typeof u !== 'string') u = String(u);
      u = u.trim();
      if (u.startsWith('/')) {
        return new URL(u, self.location.origin).href;
      }
      return new URL(u).href;
    } catch (_e) {
      try {
        return new URL('https://' + String(u)).href;
      } catch (_e2) {
        return new URL('/', self.location.origin).href;
      }
    }
  };

  let targetUrl = normalize(event?.notification?.data?.url);
  const clickToken = event?.notification?.data?.click_token || null;
  const notificationData = event?.notification?.data || {};

  // Normalize and ensure full absolute URL
  try {
    const u = new URL(targetUrl, self.location.origin);
    // Keep original path but ensure lowercase for consistency
    u.pathname = u.pathname.toLowerCase();
    // Keep existing query parameters and add tracking token if needed
    if (clickToken && !u.searchParams.get('ntk')) {
      u.searchParams.set('ntk', clickToken);
    }
    targetUrl = u.toString();
  } catch (_e) {
    // Fallback to root with token
    const fallbackUrl = new URL('/', self.location.origin);
    if (clickToken) {
      fallbackUrl.searchParams.set('ntk', clickToken);
    }
    targetUrl = fallbackUrl.toString();
  }

  event.waitUntil((async () => {
    console.log('🔔 SW: Notification clicked', {
      targetUrl,
      clickToken,
      notificationData
    });

    // Fire-and-forget tracking of the click
    if (clickToken) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/track-notification-event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ type: 'notification_click', token: clickToken, url: targetUrl }),
        });
      } catch (_e) {
        // no-op
      }
    }

    // Check if we should show banner (if PWA is already open and display_mode includes banner)
    const displayMode = notificationData.display_mode || 'navigation';
    const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    const appOrigin = self.location.origin;
    
    console.log('🔔 SW: Client analysis', {
      displayMode,
      appOrigin,
      totalClients: allClients.length,
      clients: allClients.map(c => ({ url: c.url, visibility: c.visibilityState, focused: c.focused }))
    });

    // Check for app clients more broadly (any origin match for cross-domain issues)
    const currentOrigin = new URL(self.location.origin);
    const appClients = allClients.filter(client => {
      try {
        const clientUrl = new URL(client.url);
        // Match either exact origin or common domain patterns
        return clientUrl.origin === appOrigin || 
               clientUrl.hostname.includes('croftcommontest.com') ||
               clientUrl.hostname.includes('lovableproject.com');
      } catch {
        return false;
      }
    });
    const visibleAppClients = appClients.filter(client => 
      client.visibilityState === 'visible' || client.focused
    );

    console.log('🔔 SW: App open status:', {
      appClients: appClients.length,
      visibleAppClients: visibleAppClients.length,
      shouldShowBanner: visibleAppClients.length > 0 && (displayMode === 'banner' || displayMode === 'both')
    });

    if (visibleAppClients.length > 0 && (displayMode === 'banner' || displayMode === 'both')) {
      console.log('🔔 SW: Showing banner to open app');
      // Send banner data to the main app
      try {
        const bannerData = {
          type: 'SHOW_BANNER',
          data: {
            title: event?.notification?.title || 'Notification',
            body: notificationData.banner_message || event?.notification?.body || 'Notification content',
            bannerMessage: notificationData.banner_message,
            url: targetUrl,
            icon: notificationData.icon || event?.notification?.icon,
            notificationId: notificationData.notification_id,
            clickToken: notificationData.click_token
          }
        };
        console.log('🔔 SW: Posting banner message to clients:', bannerData);
        
        // Method 1: Send to ALL app clients (not just visible ones)
        console.log('🔔 SW: Sending banner to ALL app clients');
        let messageSent = false;
        
        for (const client of appClients) {
          try {
            console.log('🔔 SW: Sending banner to client:', client.url);
            client.postMessage(bannerData);
            messageSent = true;
          } catch (clientError) {
            console.warn('🔔 SW: Failed to send message to client:', client.url, clientError);
          }
        }
        
        // Method 2: Use BroadcastChannel as backup
        try {
          const broadcastChannel = new BroadcastChannel('croft-banner-notifications');
          broadcastChannel.postMessage(bannerData);
          console.log('🔔 SW: Banner sent via BroadcastChannel');
          broadcastChannel.close();
        } catch (broadcastError) {
          console.warn('🔔 SW: BroadcastChannel failed:', broadcastError);
        }
        
        // Method 3: Use localStorage as final fallback
        try {
          // Store the banner data with a timestamp
          const fallbackData = {
            ...bannerData,
            timestamp: Date.now()
          };
          
          // Use a temporary storage approach (will be cleaned up by React)
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              if (client.url.includes(self.location.origin)) {
                try {
                  // Send a special message to trigger localStorage check
                  client.postMessage({
                    type: 'CHECK_BANNER_STORAGE',
                    data: fallbackData
                  });
                } catch (e) {
                  console.warn('🔔 SW: Failed to send storage check message:', e);
                }
              }
            });
          });
        } catch (storageError) {
          console.warn('🔔 SW: localStorage fallback failed:', storageError);
        }
        
        if (messageSent || visibleAppClients.length > 0) {
          // Focus the most recent visible client if available
          try {
            if (visibleAppClients.length > 0) {
              await visibleAppClients[0].focus();
            }
          } catch (focusError) {
            console.warn('🔔 SW: Failed to focus client:', focusError);
          }
          return; // Don't open new window
        }
      } catch (err) {
        console.warn('🔔 SW: Failed to show banner, falling back to navigation:', err);
      }
    }

    // Navigation mode or fallback - always open the target URL
    console.log('🔔 SW: Opening new window to:', targetUrl);
    try {
      const windowClient = await self.clients.openWindow(targetUrl);
      if (windowClient) {
        console.log('🔔 SW: Successfully opened window to:', targetUrl);
        await windowClient.focus();
      } else {
        console.warn('🔔 SW: Failed to open window, no client returned');
      }
    } catch (e) {
      console.warn('🔔 SW: Failed to open target URL:', e);
      // Don't fall back to root - let the browser handle it
      try {
        await self.clients.openWindow('/');
      } catch (fallbackError) {
        console.error('🔔 SW: Even fallback failed:', fallbackError);
      }
    }
  })());
});
