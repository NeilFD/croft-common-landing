import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const useNativePlatform = () => {
  const [isNative, setIsNative] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    const ios = Capacitor.getPlatform() === 'ios';
    
    setIsNative(native);
    setIsIOS(ios && native);
  }, []);

  return { isNative, isIOS };
};
