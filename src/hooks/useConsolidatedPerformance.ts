import { useEffect, useRef, useCallback } from 'react';

interface ConsolidatedPerformanceHooks {
  pauseAnimations: () => void;
  resumeAnimations: () => void;
  isPageLoaded: boolean;
}

// Singleton to ensure only one performance optimizer runs
let globalPerformanceManager: ConsolidatedPerformanceHooks | null = null;
let initializationCount = 0;
let metricsQueue: any[] = [];
let debounceTimer: NodeJS.Timeout;

export const useConsolidatedPerformance = (): ConsolidatedPerformanceHooks => {
  const isPageLoaded = useRef(false);
  const animationElements = useRef<HTMLElement[]>([]);
  const instanceId = useRef(++initializationCount);

  const pauseAnimations = useCallback(() => {
    if (instanceId.current !== 1) return;
    
    const elements = document.querySelectorAll('[class*="animate-"], [style*="animation"]');
    animationElements.current = Array.from(elements) as HTMLElement[];
    
    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.animationPlayState = 'paused';
      htmlEl.style.transition = 'none';
    });

    // Pause carousel autoplay during load
    const carousels = document.querySelectorAll('[data-embla-carousel]');
    carousels.forEach((carousel) => {
      (carousel as any)?.__embla__?.plugins()?.autoplay?.stop();
    });
  }, []);

  const resumeAnimations = useCallback(() => {
    if (instanceId.current !== 1) return;
    
    animationElements.current.forEach((el) => {
      el.style.animationPlayState = 'running';
      el.style.transition = '';
    });

    // Resume carousel autoplay immediately
    const carousels = document.querySelectorAll('[data-embla-carousel]');
    carousels.forEach((carousel) => {
      (carousel as any)?.__embla__?.plugins()?.autoplay?.play();
    });
  }, []);

  useEffect(() => {
    // Only the first instance should initialize global behavior
    if (instanceId.current === 1) {
      const handleLoad = () => {
        // Defer to avoid blocking main thread
        setTimeout(() => {
          isPageLoaded.current = true;
          resumeAnimations();
        }, 50); // Reduced from 100ms
      };

      // Initialize Web Vitals monitoring with reduced frequency
      const initializeWebVitals = () => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            const observer = new PerformanceObserver((list) => {
              const metrics: any = {};
              
              for (const entry of list.getEntries()) {
                switch (entry.entryType) {
                  case 'largest-contentful-paint':
                    // Only track if significantly poor
                    if (entry.startTime > 3000) {
                      metrics.lcp = entry.startTime;
                    }
                    break;
                  case 'first-input':
                    const fid = (entry as any).processingStart - entry.startTime;
                    if (fid > 150) { // Only track poor FID
                      metrics.fid = fid;
                    }
                    break;
                  case 'layout-shift':
                    if (!(entry as any).hadRecentInput) {
                      const clsValue = (entry as any).value;
                      if (clsValue > 0.15) { // Only track significant shifts
                        metrics.cls = (metrics.cls || 0) + clsValue;
                      }
                    }
                    break;
                }
              }

              if (Object.keys(metrics).length > 0) {
                metricsQueue.push(metrics);
                
                // Debounce metrics with longer delay
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                  if (metricsQueue.length === 0) return;
                  
                  const significantMetrics = metricsQueue[metricsQueue.length - 1];
                  if (significantMetrics.lcp && significantMetrics.lcp > 4000) {
                    console.warn('⚠️ Poor LCP:', significantMetrics.lcp + 'ms');
                  }
                  
                  metricsQueue = [];
                }, 2000); // Increased from 1000ms
              }
            });

            try {
              observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
            } catch (error) {
              // Silent fail for unsupported browsers
            }
          });
        }
      };

      // Chrome-specific optimizations (simplified)
      const initializeChromeOptimizations = () => {
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        const isMac = /Macintosh/.test(navigator.userAgent);
        
        if (!isChrome) return;

        if (isMac) {
          document.body.style.overscrollBehavior = 'none';
        }

        // Simplified Chrome optimizations
        const style = document.createElement('style');
        style.textContent = `
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .embla-carousel {
            transform: translateZ(0);
            will-change: transform;
          }
        `;
        document.head.appendChild(style);
      };

      if (document.readyState !== 'complete') {
        // Defer initial pause to avoid blocking render
        setTimeout(() => pauseAnimations(), 25); // Reduced from 50ms
        window.addEventListener('load', handleLoad, { passive: true });
        
        // Initialize monitoring after a delay
        setTimeout(() => {
          initializeWebVitals();
          initializeChromeOptimizations();
        }, 1000);
        
        return () => {
          window.removeEventListener('load', handleLoad);
          clearTimeout(debounceTimer);
        };
      } else {
        isPageLoaded.current = true;
        initializeWebVitals();
        initializeChromeOptimizations();
      }
    }
  }, [pauseAnimations, resumeAnimations]);

  // Create or return singleton
  if (!globalPerformanceManager) {
    globalPerformanceManager = {
      pauseAnimations,
      resumeAnimations,
      get isPageLoaded() { return isPageLoaded.current; }
    };
  }

  return globalPerformanceManager;
};