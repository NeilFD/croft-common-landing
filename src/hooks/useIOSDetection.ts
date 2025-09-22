import { useState, useEffect } from 'react';

export const useIOSDetection = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
    const isSafariBrowser = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsSafari(isSafariBrowser);
  }, []);

  return {
    isIOS,
    isSafari,
    isIOSSafari: isIOS && isSafari,
  };
};