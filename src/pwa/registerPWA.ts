
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

// Enhanced standalone detection with debugging and fallback methods
export const isStandalone = (() => {
  // Primary detection methods
  const mediaQueryMatch = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as any).standalone === true;
  
  // Fallback detection for iOS Safari PWA
  const cssSupportsStandalone = window.CSS && window.CSS.supports && window.CSS.supports('display-mode', 'standalone');
  const heightBasedDetection = window.innerHeight === window.screen.height;
  
  // Check if we're in a PWA context by examining the document
  const documentStandaloneCheck = document.documentElement.getAttribute('data-standalone') === 'true';
  
  const result = mediaQueryMatch || iosStandalone || documentStandaloneCheck;
  
  // Debug logging for troubleshooting
  console.log('🎯 STANDALONE DETECTION:', {
    mediaQueryMatch,
    iosStandalone,
    cssSupportsStandalone,
    heightBasedDetection,
    documentStandaloneCheck,
    finalResult: result,
    userAgent: navigator.userAgent.substring(0, 100),
    displayMode: window.matchMedia ? window.matchMedia('(display-mode: standalone)').media : 'no-media-query-support'
  });
  
  return result;
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
    // First, check which service worker is currently active
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.active) {
      const swUrl = registration.active.scriptURL;
      console.log('🔍 Current service worker:', swUrl);
      
      // If mobile service worker is active, unregister it
      if (swUrl.includes('sw-mobile.js')) {
        console.log('⚠️ Mobile service worker detected - unregistering...');
        await registration.unregister();
        console.log('✅ Mobile service worker unregistered');
      }
    }
    
    // Force register the main service worker with NUDGE functionality
    const swPath = '/sw.js';
    const reg = await navigator.serviceWorker.register(swPath, { 
      scope: '/',
      updateViaCache: 'none' // Force fresh registration
    });
    
    console.log(`✅ Service worker registered (NUDGE-enabled):`, reg.scope);
    console.log('🎯 Service worker script URL:', reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL);
    
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('✅ Service worker is ready and active');
    
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
