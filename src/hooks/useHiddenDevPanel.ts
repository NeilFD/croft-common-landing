import { useState, useCallback, useRef } from 'react';

export const useHiddenDevPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const tapCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoTap = useCallback(() => {
    tapCountRef.current++;
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Reset tap count after 2 seconds of inactivity
    timeoutRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000);
    
    // Open dev panel if tapped 7 times
    if (tapCountRef.current >= 7) {
      setIsOpen(true);
      // Broadcast a global event so any listener can open the panel UI
      try {
        window.dispatchEvent(new CustomEvent('devpanel:open'));
      } catch {}
      tapCountRef.current = 0;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    handleLogoTap,
    closePanel,
  };
};