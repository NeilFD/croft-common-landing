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

    // CRITICAL DEBUG: Check if we have zero clients
    if (allClients.length === 0) {
      console.log('🔔 SW: ❌ ZERO CLIENTS FOUND - storing debug message');
      // Store message for when app becomes visible
      localStorage.setItem('sw-debug-zero-clients', JSON.stringify({
        timestamp: Date.now(),
        notificationTitle: title,
        body: body,
        displayMode: displayMode
      }));
      return;
    }

    // DEBUG 1: Send immediate debug toast about notification click
    for (const client of allClients) {
      try {
        client.postMessage({
          type: 'SHOW_TOAST',
          data: {
            title: '🔔 SW: Notification Clicked',
            description: `Found ${allClients.length} total clients, display: ${displayMode}`
          }
        });
      } catch (e) {
        console.warn('🔔 SW: Failed to send initial debug toast:', e);
      }
    }
    
    console.log('🔔 SW: Client analysis', {
      displayMode,
      appOrigin,
      totalClients: allClients.length,
      clients: allClients.map(c => ({ url: c.url, visibility: c.visibilityState, focused: c.focused }))
    });

    // Simplified origin detection - just check if URL contains our domain
    const appClients = allClients.filter(client => {
      try {
        const clientUrl = client.url.toLowerCase();
        // More permissive matching to handle any domain variations
        return clientUrl.includes(self.location.hostname) || 
               clientUrl.startsWith(appOrigin) ||
               clientUrl.includes('localhost') ||
               clientUrl.includes('127.0.0.1');
      } catch {
        return false;
      }
    });
    
    // DEBUG 2: Send client filtering results
    for (const client of allClients) {
      try {
        client.postMessage({
          type: 'SHOW_TOAST',
          data: {
            title: '🔔 SW: Client Filter',
            description: `${allClients.length} total → ${appClients.length} app clients`
          }
        });
      } catch (e) {
        console.warn('🔔 SW: Failed to send filter debug toast:', e);
      }
    }
    
    // REMOVE visibility filtering - send to ALL app clients regardless of state
    const visibleAppClients = appClients; // All clients are considered targetable

    const shouldShowBanner = appClients.length > 0 && (displayMode === 'banner' || displayMode === 'both');

    // DEBUG 3: Send banner decision
    for (const client of allClients) {
      try {
        client.postMessage({
          type: 'SHOW_TOAST',
          data: {
            title: '🔔 SW: Banner Decision',
            description: `Should show: ${shouldShowBanner}, Mode: ${displayMode}`
          }
        });
      } catch (e) {
        console.warn('🔔 SW: Failed to send decision debug toast:', e);
      }
    }

    console.log('🔔 SW: App open status:', {
      appClients: appClients.length,
      allClientStates: appClients.map(c => ({ url: c.url, visible: c.visibilityState, focused: c.focused })),
      shouldShowBanner
    });

    if (appClients.length > 0 && (displayMode === 'banner' || displayMode === 'both')) {
      console.log('🔔 SW: Showing banner to open app');
      // Send banner data to the main app
      try {
        // 🔍 DEBUG: Show what we extracted from notification data
        console.log('🔔 SW DEBUG: Raw notificationData:', notificationData);
        console.log('🔔 SW DEBUG: notification banner_message:', notificationData.banner_message);
        
        const bannerData = {
          type: 'SHOW_BANNER',
          data: {
            title: event?.notification?.title || 'Notification',
            body: event?.notification?.body || 'Notification content',
            bannerMessage: notificationData.banner_message,
            url: targetUrl,
            icon: notificationData.icon || event?.notification?.icon,
            notificationId: notificationData.notification_id,
            clickToken: notificationData.click_token
          }
        };
        
        console.log('🔔 SW DEBUG: Complete bannerData:', bannerData);
        console.log('🔔 SW: Posting banner message to clients:', bannerData);
        
        // Send debug toast to show banner message value
        if (appClients.length > 0) {
          try {
            appClients[0].postMessage({
              type: 'SHOW_TOAST',
              data: {
                title: '🔍 SW Debug',
                description: `banner_message: "${notificationData.banner_message || 'EMPTY'}"`
              }
            });
          } catch (e) {
            console.warn('🔔 SW: Failed to send debug toast:', e);
          }
        }
        
        // Method 1: Send to ALL app clients with enhanced debugging
        console.log('🔔 SW: Sending banner to ALL app clients');
        let messageSent = false;
        
        // First send debug toast to all clients
        for (const client of appClients) {
          try {
            client.postMessage({
              type: 'SHOW_TOAST',
              data: {
                title: '🔔 SW Debug',
                description: `Found ${appClients.length} clients, sending banner`
              }
            });
          } catch (e) {
            console.warn('🔔 SW: Failed to send debug toast:', e);
          }
        }
        
        for (const client of appClients) {
          try {
            // DEBUG 4: Send attempt toast
            client.postMessage({
              type: 'SHOW_TOAST',
              data: {
                title: '🔔 SW: Sending Banner',
                description: `Attempting to send to client: ${client.visibilityState}`
              }
            });
            
            console.log('🔔 SW: Attempting to send banner to client:', {
              url: client.url,
              type: client.type,
              id: client.id,
              frameType: client.frameType,
              visibilityState: client.visibilityState,
              focused: client.focused
            });
            
            client.postMessage(bannerData);
            messageSent = true;
            console.log('🔔 SW: ✅ Successfully sent message to client:', client.url);
            
            // DEBUG 5: Send success confirmation toast
            setTimeout(() => {
              try {
                client.postMessage({
                  type: 'SHOW_TOAST',
                  data: {
                    title: '🔔 SW: Banner Sent ✅',
                    description: `Successfully sent to ${client.visibilityState} client`
                  }
                });
              } catch (e) {
                console.warn('🔔 SW: Failed to send success toast:', e);
              }
            }, 100);
            
          } catch (clientError) {
            console.warn('🔔 SW: ❌ Failed to send message to client:', client.url, clientError);
            
            // Send error toast to any working clients
            appClients.forEach(c => {
              if (c !== client) {
                try {
                  c.postMessage({
                    type: 'SHOW_TOAST',
                    data: {
                      title: '🔔 SW Error',
                      description: `Failed to send to ${client.url.split('/').pop()}`
                    }
                  });
                } catch (e) {}
              }
            });
          }
        }
        
        // Method 1.5: Direct window message as backup for same-origin
        if (appClients.length > 0) {
          try {
            // Force a direct window message through the first available client
            const primaryClient = appClients[0];
            console.log('🔔 SW: Sending direct window message through primary client');
            primaryClient.postMessage({
              type: 'FORCE_BANNER_CHECK',
              data: bannerData,
              timestamp: Date.now()
            });
          } catch (directError) {
            console.warn('🔔 SW: Direct window message failed:', directError);
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
        
        if (messageSent || appClients.length > 0) {
          // Focus the first available client
          try {
            if (appClients.length > 0) {
              await appClients[0].focus();
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

// Message listener for app communication and debugging
self.addEventListener('message', (event) => {
  console.log('🔔 SW: Received message from client:', event.data);
  
  if (event.data?.type === 'APP_READY') {
    console.log('🔔 SW: ✅ App ready signal received', {
      timestamp: event.data.timestamp,
      url: event.data.url,
      userAgent: event.data.userAgent,
      isStandalone: event.data.isStandalone
    });
  }
  
  if (event.data?.type === 'APP_FOCUSED') {
    console.log('🔔 SW: ✅ App focused signal received', {
      timestamp: event.data.timestamp,
      url: event.data.url
    });
  }
  
  if (event.data?.type === 'CHECK_BANNER_STATUS') {
    console.log('🔔 SW: Banner status check requested');
  }

  if (event.data?.type === 'PING_REQUEST') {
    console.log('🔔 SW: Ping request received');
    
    // Get current client count and respond
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
      const response = {
        clientCount: clients.length,
        clients: clients.map(c => ({
          url: c.url,
          visibilityState: c.visibilityState,
          focused: c.focused,
          type: c.type
        }))
      };
      
      console.log('🔔 SW: Ping response:', response);
      event.ports[0].postMessage(response);
    });
  }
});
