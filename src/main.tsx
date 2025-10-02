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

// Only redirect www if NOT in PWA mode
if (typeof window !== 'undefined' && !pwaMode && window.location.hostname.startsWith('www.')) {
  console.log('[Redirect] Redirecting from www to non-www');
  const target = `${window.location.protocol}//${window.location.hostname.slice(4)}${window.location.port ? ':' + window.location.port : ''}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(target);
} else {
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
}
