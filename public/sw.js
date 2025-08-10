
/* Minimal service worker for PWA + Push */
self.addEventListener('install', (event) => {
  // Activate immediately on install
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of uncontrolled clients
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Transparent pass-through; customize caching later if desired
  return;
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

  const targetUrl = normalize(event?.notification?.data?.url);

  event.waitUntil(
    (async () => {
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
