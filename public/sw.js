/* Minimal service worker for PWA + Push */
const SUPABASE_URL = 'https://xccidvoxhpgcnwinnyin.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU';

const IMAGE_CACHE = 'images-v3';
const ASSET_CACHE = 'assets-swr-v3';
const NAV_CACHE = 'sw-nav-v1';
const NAV_INTENT_URL = '/__sw_nav_intent';

self.addEventListener('install', (event) => {
  // Activate immediately on install
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control and clean old caches
  event.waitUntil((async () => {
    await self.clients.claim();
    const keep = new Set([IMAGE_CACHE, ASSET_CACHE, NAV_CACHE]);
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

  // Append tracking token and normalize same-origin path casing
  try {
    const u = new URL(targetUrl);
    if (u.origin === self.location.origin) {
      u.pathname = u.pathname.toLowerCase();
    }
    if (clickToken) {
      u.searchParams.set('ntk', clickToken);
    }
    targetUrl = u.toString();
  } catch (_e) {}

  event.waitUntil(
    (async () => {
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

      const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });

      // Check for PWA clients (more liberal detection for mobile)
      const pwaClients = allClients.filter(client => {
        try {
          const url = new URL(client.url);
          return url.origin === self.location.origin && 
                 !url.pathname.includes('/nav.html');
        } catch (_) {
          return false;
        }
      });

      // On mobile, focused detection is unreliable, so use any PWA client
      const hasPWAOpen = pwaClients.length > 0;

      // If PWA is already open, skip bounce page and use overlay system
      if (hasPWAOpen) {
        // Persist navigation intent for overlay system
        try {
          const cache = await caches.open(NAV_CACHE);
          await cache.put(NAV_INTENT_URL, new Response(
            JSON.stringify({ url: targetUrl, ts: Date.now(), clickToken }),
            { headers: { 'Content-Type': 'application/json' } }
          ));
        } catch (_e) {}

        // Broadcast to existing clients to trigger overlay
        let bc = null;
        try { bc = new BroadcastChannel('nav-handoff-v1'); } catch (_e) {}
        const broadcast = () => {
          try { bc && bc.postMessage({ type: 'SW_NAVIGATE', url: targetUrl }); } catch (_) {}
          for (const c of allClients) {
            try { c.postMessage({ type: 'SW_NAVIGATE', url: targetUrl }); } catch (_) {}
          }
        };
        
        // Multiple broadcasts to ensure delivery
        const delay = (ms) => new Promise((res) => setTimeout(res, ms));
        try {
          broadcast();
          await delay(100);
          broadcast();
          await delay(300);
          broadcast();
        } catch (_) {} finally {
          try { bc && bc.close(); } catch (_) {}
        }
        
        return;
      }

      // PWA not open or not focused - use bounce page (existing behavior)
      try {
        const bounceUrl = `/nav.html?to=${encodeURIComponent(targetUrl)}&mode=new`;
        const opened = await self.clients.openWindow(bounceUrl);
        try { if (opened && 'focus' in opened) { await opened.focus(); } } catch (_) {}
      } catch (_) {}

      // Persist navigation intent for durable handoff
      try {
        const cache = await caches.open(NAV_CACHE);
        await cache.put(NAV_INTENT_URL, new Response(
          JSON.stringify({ url: targetUrl, ts: Date.now(), clickToken }),
          { headers: { 'Content-Type': 'application/json' } }
        ));
      } catch (_e) {}

      // Broadcast to all existing clients as backup
      let bc = null;
      try { bc = new BroadcastChannel('nav-handoff-v1'); } catch (_e) {}
      const broadcast = () => {
        try { bc && bc.postMessage({ type: 'SW_NAVIGATE', url: targetUrl }); } catch (_) {}
        for (const c of allClients) {
          try { c.postMessage({ type: 'SW_NAVIGATE', url: targetUrl }); } catch (_) {}
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
    })()
  );
});
