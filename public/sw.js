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

      // Actively navigate any existing clients to the target URL (most reliable on iOS)
      let navigated = false;
      for (const c of allClients) {
        try {
          if ('navigate' in c) {
            await c.navigate(targetUrl);
            navigated = true;
            if ('focus' in c) { try { await c.focus(); } catch (_) {} }
          }
        } catch (_e) {}
      }

      // Fallback: open a bounce page that immediately redirects (more reliable)
      if (!navigated) {
        try {
          const bounceUrl = `/nav.html?to=${encodeURIComponent(targetUrl)}`;
          const opened = await self.clients.openWindow(bounceUrl);
          try {
            if (opened && 'focus' in opened) { await opened.focus(); }
          } catch (_) {}
          // do not return; we'll also broadcast SW_NAVIGATE so the page can force navigation
        } catch (_e) {
          // no-op
        }
      }

      // Persist navigation intent for durable handoff
      try {
        const cache = await caches.open(NAV_CACHE);
        await cache.put(NAV_INTENT_URL, new Response(
          JSON.stringify({ url: targetUrl, ts: Date.now(), clickToken }),
          { headers: { 'Content-Type': 'application/json' } }
        ));
      } catch (_e) {}

      let bc = null;
      try { bc = new BroadcastChannel('nav-handoff-v1'); } catch (_e) {}
      // Notify existing clients to force navigation on the main thread (rebroadcast a few times)
      const broadcast = () => {
        // Broadcast via BroadcastChannel (more reliable on iOS)
        try { bc && bc.postMessage({ type: 'SW_NAVIGATE', url: targetUrl }); } catch (_) {}
        // And via direct postMessage to all clients
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
      } catch (_e) {} finally {
        try { bc && bc.close(); } catch (_) {}
      }


      // Fallback: try navigating an existing same-origin tab
      try {
        const target = new URL(targetUrl);
        const sameOrigin = allClients.find((c) => new URL(c.url).origin === target.origin);
        if (sameOrigin && 'navigate' in sameOrigin) {
          await sameOrigin.navigate(targetUrl);
          if ('focus' in sameOrigin) return sameOrigin.focus();
          return;
        }
      } catch (_e) {
        // no-op
      }

      // If we still have a client, just focus it (message above should trigger navigation)
      if (allClients.length > 0 && 'focus' in allClients[0]) {
        return allClients[0].focus();
      }

      // Last resort
      return self.clients.openWindow(targetUrl);
    })()
  );
});
