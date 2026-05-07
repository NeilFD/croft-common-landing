export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

// Standalone detection
export const isStandalone = (() => {
  const mediaQueryMatch = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as any).standalone === true;
  const documentStandaloneCheck = document.documentElement.getAttribute('data-standalone') === 'true';
  return mediaQueryMatch || iosStandalone || documentStandaloneCheck;
})();

export function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isIOS && isSafari;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    // Clean up legacy mobile worker if present
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing?.active && existing.active.scriptURL.includes('sw-mobile.js')) {
      await existing.unregister();
    }

    // Register the main service worker. No forced update, no SKIP_WAITING.
    // The browser will pick up new versions on its own; new SW activates only
    // after all existing tabs are closed, which prevents reload loops.
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (e) {
    console.error('Service worker registration failed:', e);
    return null;
  }
}

export function setupInstallPromptListener(onAvailable: () => void, onInstalled: () => void) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e as BeforeInstallPromptEvent;
    onAvailable();
  });

  window.addEventListener('appinstalled', () => {
    window.deferredPrompt = null;
    onInstalled();
  });
}
