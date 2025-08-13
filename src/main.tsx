import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './pwa'

// Add service worker message listener for deep linking when PWA is open
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (evt) => {
    const data = evt.data || {};
    if (data.type === 'OPEN_URL' && typeof data.url === 'string') {
      try {
        // Use global router navigate if available
        if ((window as any).__APP_ROUTER_NAVIGATE__) {
          (window as any).__APP_ROUTER_NAVIGATE__(data.url);
        } else {
          // Fallback to history API
          window.history.pushState({}, '', data.url);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      } catch {
        window.location.assign(data.url);
      }
    }
  });
}

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
