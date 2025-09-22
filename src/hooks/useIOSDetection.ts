import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const useIOSDetection = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isPWAStandalone, setIsPWAStandalone] = useState(false);
  const [isCapacitorNative, setIsCapacitorNative] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    
    // Enhanced iOS detection - include iPadOS 13+ which reports as macOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) || 
                        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Safari detection
    const isSafariBrowser = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent);
    
    // PWA standalone mode detection
    const isPWA = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
                  (window.navigator as any).standalone === true ||
                  document.documentElement.getAttribute('data-standalone') === 'true';
    
    // Capacitor native detection
    const isCapacitor = Capacitor.isNativePlatform();
    
    setIsIOS(isIOSDevice);
    setIsSafari(isSafariBrowser);
    setIsPWAStandalone(isPWA);
    setIsCapacitorNative(isCapacitor);
  }, []);

  return {
    isIOS,
    isSafari,
    isPWAStandalone,
    isCapacitorNative,
    isIOSSafari: isIOS && isSafari,
    shouldUseDirectOpen: isIOS && (isSafari || isPWAStandalone || isCapacitorNative),
  };
};