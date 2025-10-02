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
    });
});
