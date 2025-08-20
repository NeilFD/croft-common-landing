// PWA utility functions for detecting context and handling authentication

export const isPWA = (): boolean => {
  // Check if running in PWA standalone mode
  return (
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    // @ts-ignore iOS Safari standalone mode
    (window.navigator as any).standalone === true ||
    // Check for Capacitor (mobile app wrapper)
    !!(window as any).Capacitor
  );
};

export const isIOSPWA = (): boolean => {
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
  return isIOS && isPWA();
};

export const logPWAContext = (context: string) => {
  const pwaStatus = isPWA();
  const iosPWA = isIOSPWA();
  console.log(`🏠 [PWA-${context}] isPWA: ${pwaStatus}, isIOSPWA: ${iosPWA}, userAgent: ${navigator.userAgent.substring(0, 50)}...`);
  return { pwaStatus, iosPWA };
};

// Store authentication state in localStorage for PWA persistence
export const storePWAAuthState = (isMember: boolean, userHandle?: string) => {
  const state = {
    isMember,
    userHandle,
    timestamp: Date.now()
  };
  localStorage.setItem('pwa_auth_state', JSON.stringify(state));
  console.log('🏠 [PWA-Auth] Stored auth state:', state);
};

export const retrievePWAAuthState = () => {
  try {
    const stored = localStorage.getItem('pwa_auth_state');
    if (!stored) return null;
    
    const state = JSON.parse(stored);
    const age = Date.now() - state.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (age > maxAge) {
      localStorage.removeItem('pwa_auth_state');
      return null;
    }
    
    console.log('🏠 [PWA-Auth] Retrieved auth state:', state);
    return state;
  } catch {
    return null;
  }
};

export const clearPWAAuthState = () => {
  localStorage.removeItem('pwa_auth_state');
  console.log('🏠 [PWA-Auth] Cleared auth state');
};