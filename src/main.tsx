import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Simplified PWA detection
const isPWAMode = () => {
  if (typeof window === 'undefined') return false;
  
  const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
                     (window.navigator as any).standalone === true;
  
  if (standalone) {
    console.log('[PWA] Detected standalone mode');
    document.documentElement.setAttribute('data-standalone', 'true');
  }
  
  return standalone;
};

const pwaMode = isPWAMode();

// Domain consistency: no client-side redirect (enforce at DNS/edge for canonical URL)
// This keeps service worker scope, caches, and push subscriptions stable
console.log(`[Init] Starting app (PWA mode: ${pwaMode})`);

createRoot(document.getElementById("root")!).render(<App />);
  
// Initialise native status bar (iOS) without blocking render
import('./mobile/initStatusBar')
  .then(({ initStatusBar }) => { 
    if (typeof initStatusBar === 'function') {
      console.log('[StatusBar] Initialising');
      initStatusBar();
    }
  })
  .catch((err) => { console.warn('[StatusBar] Init skipped:', err); });

// Chunk-load error recovery for iOS PWA
let hasRecovered = false;
const recoverFromChunkError = async (error: any) => {
  if (hasRecovered) return;
  const msg = error?.message || String(error);
  if (msg.includes('ChunkLoadError') || msg.includes('Failed to fetch dynamically imported module')) {
    hasRecovered = true;
    console.error('[ChunkLoad] Detected chunk load failure, recovering:', msg);
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) await reg.unregister();
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    } catch (e) {
      console.warn('[ChunkLoad] Recovery cleanup failed:', e);
    }
    window.location.replace(window.location.pathname + '?bypass-cache=' + Date.now());
  }
};

window.addEventListener('error', (event) => {
  recoverFromChunkError(event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  recoverFromChunkError(event.reason);
});

// Initialize PWA with better error handling
requestAnimationFrame(() => {
  import('./pwa/deferredPWA')
    .then(({ initializePWA }) => {
      if (typeof initializePWA === 'function') {
        console.log('[PWA] Starting initialization');
        initializePWA().catch((err) => {
          console.error('[PWA] Initialization failed:', err);
        });
      }
    })
    .catch((err) => {
      console.error('[PWA] Module load failed:', err);
      recoverFromChunkError(err);
    });
});
