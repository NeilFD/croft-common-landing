import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initBootLogger } from './mobile/bootLogger'

initBootLogger();

let hasRecoveredFromChunkError = false;

const getChunkErrorText = (source: any) => [
  source?.message,
  source?.error?.message,
  source?.reason?.message,
  source?.sourceUrl,
  typeof source === 'string' ? source : undefined,
].filter(Boolean).join(' ');

const isChunkLoadFailure = (text: string) => (
  text.includes('ChunkLoadError') ||
  text.includes('Failed to fetch dynamically imported module') ||
  text.includes('Importing a module script failed') ||
  text.includes('error loading dynamically imported module') ||
  /\/assets\/.*\.js/.test(text) ||
  /\/node_modules\/\.vite\/deps\/.*\.js/.test(text)
);

const recoverFromChunkError = async (source: any) => {
  if (hasRecoveredFromChunkError) return;

  const text = getChunkErrorText(source);
  if (!isChunkLoadFailure(text)) return;

  hasRecoveredFromChunkError = true;
  console.error('[ChunkLoad] Detected module load failure, recovering:', text);

  try {
    const lastRecovery = Number(sessionStorage.getItem('cc_chunk_recovery_at') || '0');
    if (Date.now() - lastRecovery < 5000) return;
    sessionStorage.setItem('cc_chunk_recovery_at', String(Date.now()));
  } catch {}

  try {
    const registrations = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((registrations || []).map((reg) => reg.unregister()));

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  } catch (e) {
    console.warn('[ChunkLoad] Recovery cleanup failed:', e);
  }

  const url = new URL(window.location.href);
  url.searchParams.set('bypass-cache', Date.now().toString());
  window.location.replace(url.toString());
};

window.addEventListener('error', (event) => {
  const target = event.target as HTMLElement | null;
  const sourceUrl = event.filename ||
    ((target instanceof HTMLScriptElement || target instanceof HTMLLinkElement) ? target.href || target.getAttribute('src') || '' : '');
  recoverFromChunkError({ message: event.message, error: event.error, sourceUrl });
}, true);

window.addEventListener('unhandledrejection', (event) => {
  recoverFromChunkError(event.reason);
});

const isNativeRuntime = () => Boolean((window as any)?.Capacitor?.isNativePlatform?.() === true);

// Build/version logging and native push initialisation must not block first paint.
const initialiseNativeAfterPaint = () => {
  try {
    const run = async () => {
      try {
        const [{ getAppVersion }, { nativePush }] = await Promise.all([
          import('./lib/appVersion'),
          import('./services/nativePush'),
        ]);
        const info = await getAppVersion();
        console.info('[BUILD] App boot', {
          now: new Date().toISOString(),
          version: info.version,
          build: info.buildNumber,
          platform: info.platform,
          buildTime: (import.meta as any).env?.BUILD_TIME,
        });

        if (isNativeRuntime()) {
          console.log('📱 [Push] Early initialise listeners');
          nativePush.initialize('boot:main');
        }
      } catch (e) {
        console.warn('[BUILD] Version lookup failed', e);
      }
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(run, { timeout: 2500 });
    } else {
      setTimeout(run, 1500);
    }
  } catch (e) {
    console.warn('[BUILD] Deferred initialisation failed', e);
  }
};

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

// Native heartbeat - first 30 seconds only
if (isNativeRuntime()) {
  const bootSessionId = localStorage.getItem('cc_boot_session_id') || `mobile-debug-${Date.now()}`;
  const platform = (window as any).Capacitor?.getPlatform?.() || 'native';
  let heartbeatCount = 0;
  const maxHeartbeats = 6;
  
  const sendHeartbeat = () => {
    if (heartbeatCount >= maxHeartbeats) return;
    
    const payload = JSON.stringify({
      session_id: bootSessionId,
      step: 'native_heartbeat',
      data: { count: heartbeatCount + 1 },
      platform,
      user_agent: navigator.userAgent.substring(0, 500),
      ts: new Date().toISOString()
    });
    
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/mobile-debug-log', blob);
    } else {
      fetch('https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/mobile-debug-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
    
    heartbeatCount++;
    if (heartbeatCount < maxHeartbeats) {
      setTimeout(sendHeartbeat, 5000);
    }
  };
  
  // Start first heartbeat after 1 second
  setTimeout(sendHeartbeat, 1000);
  console.log('📱 Native heartbeat started (6 beats over 30s)');
}

// Domain consistency: no client-side redirect (enforce at DNS/edge for canonical URL)
// This keeps service worker scope, caches, and push subscriptions stable
console.log(`[Init] Starting app (PWA mode: ${pwaMode})`);

createRoot(document.getElementById("root")!).render(<App />);
initialiseNativeAfterPaint();
  
// Initialise native status bar (iOS) without blocking render
import('./mobile/initStatusBar')
  .then(({ initStatusBar }) => { 
    if (typeof initStatusBar === 'function') {
      console.log('[StatusBar] Initialising');
      initStatusBar();
    }
  })
  .catch((err) => { console.warn('[StatusBar] Init skipped:', err); });

// PWA registration is intentionally disabled. The static worker files in
// /public are kill-switches that clear old Safari/PWA caches and unregister.
console.log('[PWA] Registration disabled while mobile cache cleanup ships');
