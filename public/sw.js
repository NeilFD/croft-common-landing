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
  console.log('🔔 SW: Notification clicked', { data: event.notification.data });
  
  event.notification.close();

  const data = event.notification.data || {};
  const { url, click_token: clickToken, display_mode: displayMode = 'navigation', banner_message: bannerMessage } = data;

  // Extract notification token from URL for database storage
  let notificationToken = null;
  if (url) {
    try {
      const urlObj = new URL(url);
      notificationToken = urlObj.searchParams.get('ntk');
    } catch (e) {
      console.warn('🔔 SW: Could not parse URL:', e);
    }
  }

  // Store banner in database for reliability
  if (notificationToken) {
    try {
      await fetch('https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/store-pending-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationToken,
          title: event.notification.title,
          body: event.notification.body,
          bannerMessage: bannerMessage,
          url: url,
          icon: event.notification.icon
        })
      });
      console.log('🔔 SW: Banner stored in database');
    } catch (error) {
      console.error('🔔 SW: Failed to store banner in database:', error);
    }
  }

  // Track notification click
  if (clickToken) {
    try {
      await fetch('https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/track-notification-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'notification_click',
          token: clickToken,
          url: url
        })
      });
      console.log('🔔 SW: Click tracked successfully');
    } catch (error) {
      console.error('🔔 SW: Failed to track click:', error);
    }
  }

  event.waitUntil((async () => {
    // Handle based on display mode
    if (displayMode === 'banner') {
      console.log('🔔 SW: Banner mode - attempting to show banner');
      
      // Get all clients
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });

      console.log('🔔 SW: Found clients:', clients.length);

      let bannerShown = false;

      // Try to show banner to any matching client
      for (const client of clients) {
        if (client.url.includes('croftcommontest.com') || client.url.includes('localhost')) {
          console.log('🔔 SW: Sending banner to client:', client.url);
          
          const bannerData = {
            type: 'SHOW_BANNER',
            data: {
              title: event.notification.title,
              body: event.notification.body,
              bannerMessage: bannerMessage,
              url: url,
              icon: event.notification.icon,
              notificationId: data.notification_id,
              clickToken: clickToken
            }
          };

          console.log('🔔 SW: Banner data:', bannerData);

          // Use BroadcastChannel as primary method
          try {
            const channel = new BroadcastChannel('notification-events');
            channel.postMessage(bannerData);
            console.log('🔔 SW: BroadcastChannel message sent');
            bannerShown = true;
            break;
          } catch (error) {
            console.error('🔔 SW: BroadcastChannel failed:', error);
          }
        }
      }

      if (!bannerShown) {
        console.log('🔔 SW: No clients found, opening window');
        if (url) {
          await self.clients.openWindow(url);
        }
      }
    } else {
      // Navigation mode - always open a window
      console.log('🔔 SW: Navigation mode - opening window');
      if (url) {
        await self.clients.openWindow(url);
      }
    }
          url: targetUrl,
          icon: notificationData.icon || event?.notification?.icon,
          notificationId: notificationData.notification_id,
          clickToken: notificationData.click_token
        }
      };
      
      console.log('🔔 SW: FINAL banner message payload:', {
        fullPayload: bannerData,
        bannerMessageValue: bannerData.data.bannerMessage,
        bodyValue: bannerData.data.body,
        titleValue: bannerData.data.title
      });
      
      // Enhanced message delivery with multiple fallback methods
      let messageSent = false;
      
      // Method 1: Direct client messaging
      for (const client of appClients) {
        try {
          console.log('🔔 SW: Sending to client:', {
            url: client.url,
            state: client.visibilityState,
            focused: client.focused
          });
          
          await client.postMessage(bannerData);
          messageSent = true;
          console.log('🔔 SW: ✅ Message sent successfully to:', client.url);
          
        } catch (clientError) {
          console.error('🔔 SW: ❌ Client message failed:', client.url, clientError);
        }
      }
        
        // Method 2: BroadcastChannel as backup
        try {
          const broadcastChannel = new BroadcastChannel('croft-banner-notifications');
          broadcastChannel.postMessage(bannerData);
          broadcastChannel.close();
          messageSent = true;
          console.log('🔔 SW: ✅ Broadcast message sent');
        } catch (broadcastError) {
          console.warn('🔔 SW: ❌ Broadcast failed:', broadcastError);
        }
        
        // Method 3: Store in localStorage as final fallback
        try {
          self.localStorage?.setItem('pending-banner-notification', JSON.stringify({
            ...bannerData,
            timestamp: Date.now()
          }));
          console.log('🔔 SW: ✅ Stored banner in localStorage as fallback');
        } catch (storageError) {
          console.warn('🔔 SW: ❌ Storage fallback failed:', storageError);
        }
        
        if (!messageSent) {
          console.error('🔔 SW: ❌ ALL banner delivery methods failed!');
        }
        
      } catch (bannerError) {
        console.error('🔔 SW: ❌ Banner processing failed:', bannerError);
      }
      
      // Don't navigate if we showed a banner
      return;
    }

    // If no app clients or display mode is navigation, proceed with navigation
    if (appClients.length === 0 || displayMode === 'navigation' || displayMode === 'both') {
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
