import React, { useEffect, useMemo, useState } from 'react';

// Lightweight, standalone overlay that prompts the user to open a pending notification link
// when automatic navigation is unreliable (notably iOS PWAs requiring user gesture).
// This mounts outside the main app and has zero coupling.

const NAV_CACHE = 'sw-nav-v1';
const NAV_INTENT_URL = '/__sw_nav_intent';

function isIOSStandalone(): boolean {
  const ua = navigator.userAgent || '';
  const isiOS = /iPad|iPhone|iPod/i.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
  const standalone = (window as any).navigator?.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  return Boolean(isiOS && standalone);
}

async function peekPendingUrl(): Promise<string | null> {
  // SessionStorage (set by SW message handler or other code)
  try {
    const s = sessionStorage.getItem('pwa.nav-intent');
    if (s && typeof s === 'string') return s;
  } catch (_) {}

  // Cache Storage (durable handoff written by the SW)
  if ('caches' in window) {
    try {
      const cache = await caches.open(NAV_CACHE);
      const res = await cache.match(NAV_INTENT_URL);
      if (res) {
        const data = await res.json().catch(() => null) as any;
        if (data && typeof data.url === 'string') return data.url as string;
      }
    } catch (_) {}
  }
  return null;
}

async function clearPendingUrl() {
  try { sessionStorage.removeItem('pwa.nav-intent'); } catch (_) {}
  if ('caches' in window) {
    try {
      const cache = await caches.open(NAV_CACHE);
      await cache.delete(NAV_INTENT_URL);
    } catch (_) {}
  }
}

function usePendingNavIntent() {
  const [url, setUrl] = useState<string | null>(null);

  const refresh = async () => {
    const u = await peekPendingUrl();
    if (import.meta.env.DEV) console.info('[NavIntentOverlay] refresh found URL:', u);
    setUrl(u);
  };

  useEffect(() => {
    // Always listen for nav intents, not just on iOS standalone

    // Initial check
    void refresh();

    // Listen for BroadcastChannel handoff
    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('nav-handoff-v1');
        bc.addEventListener('message', async (event) => {
          const data = (event as MessageEvent).data as any;
          if (data && data.type === 'SW_NAVIGATE' && typeof data.url === 'string') {
            try { sessionStorage.setItem('pwa.nav-intent', data.url); } catch (_) {}
            if (import.meta.env.DEV) console.info('[NavIntentOverlay] received handoff via BroadcastChannel', data.url);
            await refresh();
          }
        });
      }
    } catch (_) {}

    // Also poll briefly when page becomes visible/focused
    const onVis = () => { if (document.visibilityState === 'visible') void refresh(); };
    const onFocus = () => { void refresh(); };
    const onRefresh = () => { void refresh(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onFocus);
    window.addEventListener('nav-intent-refresh', onRefresh);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('nav-intent-refresh', onRefresh);
      try { bc?.close(); } catch (_) {}
    };
  }, []);

  return { url, setUrl, refresh };
}

function Banner({ url, onOpen, onDismiss }: { url: string; onOpen: () => void; onDismiss: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000] px-4 pb-6 sm:pb-8">
      <div className="mx-auto max-w-md rounded-xl border border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-lg">
        <div className="p-4 sm:p-5">
          <p className="text-sm sm:text-base text-foreground">
            A notification wants to open a page. Tap to proceed.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onOpen}
              className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition"
            >
              Open notification
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground focus:outline-none"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavIntentOverlayImpl() {
  const { url, setUrl, refresh } = usePendingNavIntent();

  // If we've already navigated to the target, clear the intent and hide the banner
  useEffect(() => {
    if (!url) return;
    const isSame = (() => {
      try {
        const t = new URL(url, window.location.origin);
        t.searchParams.delete('ntk');
        const c = new URL(window.location.href);
        c.searchParams.delete('ntk');
        return t.origin === c.origin && t.pathname === c.pathname && t.search === c.search;
      } catch {
        return false;
      }
    })();
    if (isSame) {
      void (async () => {
        await clearPendingUrl();
        setUrl(null);
      })();
    }
  }, [url, setUrl]);

  const onOpen = async () => {
    const target = (await peekPendingUrl()) || url;
    if (target) {
      if (import.meta.env.DEV) console.info('[NavIntentOverlay] user-initiated navigate', target);
      try {
        window.location.assign(new URL(target, window.location.origin).toString());
      } catch {
        window.location.assign(target);
      }
    }
  };

  const onDismiss = async () => {
    await clearPendingUrl();
    await refresh();
    setUrl(null);
  };

  // Show banner if we have a pending URL (on any platform when programmatic nav fails)
  if (!url) return null;
  return <Banner url={url} onOpen={onOpen} onDismiss={onDismiss} />;
}

export async function mountNavIntentOverlay() {
  // Only mount once
  if ((window as any).__navIntentOverlayMounted) return;
  (window as any).__navIntentOverlayMounted = true;

  const rootId = 'nav-intent-overlay-root';
  let host = document.getElementById(rootId);
  if (!host) {
    host = document.createElement('div');
    host.id = rootId;
    document.body.appendChild(host);
  }

  const { createRoot } = await import('react-dom/client');
  const root = createRoot(host);
  root.render(React.createElement(NavIntentOverlayImpl));

  // Expose a tiny helper so other scripts can trigger the banner
  (window as any).__navIntentOverlayShow = async (url?: string) => {
    if (import.meta.env.DEV) console.info('[NavIntentOverlay] __navIntentOverlayShow called with:', url);
    if (url) {
      try { sessionStorage.setItem('pwa.nav-intent', url); } catch (_) {}
    }
    // Trigger a refresh to update the overlay state
    const event = new CustomEvent('nav-intent-refresh');
    window.dispatchEvent(event);
  };
}
