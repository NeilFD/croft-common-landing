import { useState, useCallback, useRef, useEffect } from 'react';

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
      // Harden event dispatch for iOS compatibility
      try {
        window.dispatchEvent(new CustomEvent('devpanel:open'));
        window.dispatchEvent(new Event('devpanel:open'));
        document.dispatchEvent(new CustomEvent('devpanel:open'));
      } catch (error) {
        console.warn('Failed to dispatch devpanel:open event:', error);
      }
      tapCountRef.current = 0;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, []);

  const openPanel = useCallback(() => {
    setIsOpen(true);
    // Harden event dispatch for iOS compatibility
    try {
      window.dispatchEvent(new CustomEvent('devpanel:open'));
      window.dispatchEvent(new Event('devpanel:open'));
      document.dispatchEvent(new CustomEvent('devpanel:open'));
    } catch (error) {
      console.warn('Failed to dispatch devpanel:open event:', error);
    }
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    try {
      window.dispatchEvent(new CustomEvent('devpanel:close'));
      window.dispatchEvent(new Event('devpanel:close'));
    } catch {}
  }, []);

  // Auto-open via URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = window.location.hash;
    
    if (urlParams.get('dev') === '1' || hashParams === '#dev') {
      setTimeout(() => openPanel(), 100); // Small delay to ensure components are mounted
    }
  }, [openPanel]);

  return {
    isOpen,
    handleLogoTap,
    openPanel,
    closePanel,
  };
};