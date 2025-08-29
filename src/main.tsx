import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'


// Set standalone attribute early for PWA detection
if (
  typeof window !== 'undefined' &&
  ((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
   (window.navigator as any).standalone === true)
) {
  document.documentElement.setAttribute('data-standalone', 'true');
}

// Only redirect if not in PWA mode and has www prefix
if (
  typeof window !== 'undefined' &&
  !(
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (window.navigator as any).standalone === true ||
    document.documentElement.getAttribute('data-standalone') === 'true'
  ) &&
  window.location.hostname.startsWith('www.')
) {
  const target = `${window.location.protocol}//${window.location.hostname.slice(4)}${window.location.port ? ':' + window.location.port : ''}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(target);
} else {
  createRoot(document.getElementById("root")!).render(<App />);
  
  // Initialize PWA earlier and with better timing
  requestAnimationFrame(async () => {
    const { initializePWA } = await import('./pwa/deferredPWA');
    initializePWA();
  });
}
