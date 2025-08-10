
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

export const isStandalone =
  (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
  // @ts-ignore iOS Safari
  (window.navigator as any).standalone === true;

export function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isIOS && isSafari;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Service worker registered:', reg.scope);
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
    console.log('👉 beforeinstallprompt captured');
    onAvailable();
  });

  window.addEventListener('appinstalled', () => {
    console.log('🎉 App installed');
    window.deferredPrompt = null;
    onInstalled();
  });
}
