
/* Minimal service worker for PWA + Push */
const SUPABASE_URL = 'https://xccidvoxhpgcnwinnyin.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU';
self.addEventListener('install', (event) => {
  // Activate immediately on install
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of uncontrolled clients
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Cache-first with SWR for images and built assets
  const isSameOrigin = url.origin === self.location.origin;
  const isImage = /\.(?:png|jpg|jpeg|gif|webp|avif|svg)$/i.test(url.pathname);
  const isBuiltAsset = isSameOrigin && url.pathname.startsWith('/assets/');
  if (isImage || isBuiltAsset) {
    event.respondWith((async () => {
      const cache = await caches.open('static-swr-v1');
      const cached = await cache.match(req, { ignoreVary: true });
      const fetchPromise = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
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

      // Try exact match first
      const exact = allClients.find((c) => c.url === targetUrl);
      if (exact && 'focus' in exact) {
        return exact.focus();
      }

      // Prefer opening a new window directly to ensure path is respected (iOS-friendly)
      try {
        const opened = await self.clients.openWindow(targetUrl);
        if (opened && 'focus' in opened) return opened.focus();
        if (opened) return;
      } catch (_e) {
        // no-op
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

      // Last resort
      return self.clients.openWindow(targetUrl);
    })()
  );
});
