import { useEffect } from 'react';

// Chrome-specific optimizations
export const useChromeOptimizations = () => {
  useEffect(() => {
    // Detect Chrome
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isMac = /Macintosh/.test(navigator.userAgent);
    
    if (!isChrome) return;

    // Chrome-specific optimizations
    const optimizeForChrome = () => {
      // Reduce memory pressure by limiting concurrent image decodes
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          // Force garbage collection hint (Chrome only)
          if ((window as any).gc) {
            try {
              (window as any).gc();
            } catch (e) {
              // Silent fail
            }
          }
        });
      }

      // Optimize CSS for Chrome rendering
      const style = document.createElement('style');
      style.textContent = `
        /* Chrome-specific optimizations */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        img {
          image-rendering: -webkit-optimize-contrast;
        }
        
        /* Reduce Chrome's aggressive composite layer creation */
        .embla-carousel {
          transform: translateZ(0);
          will-change: transform;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    };

    // Mac-specific Chrome optimizations
    if (isMac) {
      // Reduce scrolling jank on Mac Chrome
      document.body.style.overscrollBehavior = 'none';
    }

    return optimizeForChrome();
  }, []);
};