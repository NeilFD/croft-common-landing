const CLEANUP_PARAM = 'sw-cleanup';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      await self.clients.claim();
    } catch {}

    try {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    } catch {}

    try {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      await Promise.all(clients.map((client) => {
        try {
          const url = new URL(client.url);
          if (!url.searchParams.has(CLEANUP_PARAM)) {
            url.searchParams.set(CLEANUP_PARAM, Date.now().toString());
            return client.navigate(url.toString());
          }
        } catch {}
        return Promise.resolve();
      }));
    } catch {}

    try {
      await self.registration.unregister();
    } catch {}
  })());
});

self.addEventListener('fetch', () => {});
