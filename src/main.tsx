import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './pwa'

// Router handover: we will call this from multiple places
async function handleDeepLink(url) {
  if (!url) return;
  try {
    // If you have React Router v6, prefer the global bridge set below
    if (typeof (window as any).__APP_ROUTER_NAVIGATE__ === 'function') {
      (window as any).__APP_ROUTER_NAVIGATE__(url);
      return;
    }
    // Soft navigate for SPAs
    const here = new URL(window.location.href);
    const there = new URL(url, here.origin);
    if (here.href !== there.href) {
      window.history.pushState({}, '', there.href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  } catch {
    // Hard navigate if SPA navigation is not available
    window.location.assign(url);
  }
}

// Read and clear the saved deep link from the cache
async function drainDeepLinkFromCache() {
  try {
    const cache = await caches.open('cc-deeplink');
    const res = await cache.match('/__deeplink__');
    if (!res) return null;
    const data = await res.json();
    // Clear it so we do not reprocess
    await cache.delete('/__deeplink__');
    return data?.url || null;
  } catch {
    return null;
  }
}

// 1) Listen for SW direct messages
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (evt) => {
    const msg = evt.data || {};
    if (msg.type === 'OPEN_URL' && typeof msg.url === 'string') {
      handleDeepLink(msg.url);
    }
  });
}

// 2) Listen on BroadcastChannel as the fast path
try {
  const bc = new BroadcastChannel('cc-deeplink');
  bc.addEventListener('message', (evt) => {
    const url = evt?.data?.url;
    if (typeof url === 'string') handleDeepLink(url);
  });
} catch { /* BroadcastChannel may not exist; fine */ }

// 3) Fallback: when app becomes visible or focused, drain from cache
function tryDrainOnVisibility() {
  drainDeepLinkFromCache().then(url => url && handleDeepLink(url));
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') tryDrainOnVisibility();
});
window.addEventListener('focus', tryDrainOnVisibility);
// Also try once shortly after boot to catch early resumes
setTimeout(tryDrainOnVisibility, 300);

if (
  typeof window !== 'undefined' &&
  !(
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    // @ts-ignore iOS Safari
    (window.navigator as any).standalone === true
  ) &&
  window.location.hostname.startsWith('www.')
) {
  const target = `${window.location.protocol}//${window.location.hostname.slice(4)}${window.location.port ? ':' + window.location.port : ''}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(target);
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
