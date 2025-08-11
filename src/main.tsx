import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './pwa'

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
