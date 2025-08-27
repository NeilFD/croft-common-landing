import { useEffect, useRef, useCallback } from 'react';

interface PerformanceOptimizer {
  pauseAnimations: () => void;
  resumeAnimations: () => void;
  isPageLoaded: boolean;
}

// Singleton to ensure only one performance optimizer runs
let globalOptimizer: PerformanceOptimizer | null = null;
let initializationCount = 0;

export const useOptimizedPerformance = (): PerformanceOptimizer => {
  const isPageLoaded = useRef(false);
  const animationElements = useRef<HTMLElement[]>([]);
  const instanceId = useRef(++initializationCount);

  const pauseAnimations = useCallback(() => {
    // Only the first instance should control animations
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
    // Only the first instance should control animations
    if (instanceId.current !== 1) return;
    
    animationElements.current.forEach((el) => {
      el.style.animationPlayState = 'running';
      el.style.transition = '';
    });

    // Resume carousel autoplay after load
    setTimeout(() => {
      const carousels = document.querySelectorAll('[data-embla-carousel]');
      carousels.forEach((carousel) => {
        (carousel as any)?.__embla__?.plugins()?.autoplay?.play();
      });
    }, 1000);
  }, []);

  useEffect(() => {
    // Only the first instance should initialize global behavior
    if (instanceId.current === 1) {
      const handleLoad = () => {
        isPageLoaded.current = true;
        resumeAnimations();
      };

      if (document.readyState !== 'complete') {
        pauseAnimations();
        window.addEventListener('load', handleLoad);
        
        return () => {
          window.removeEventListener('load', handleLoad);
        };
      } else {
        isPageLoaded.current = true;
      }
    }
  }, [pauseAnimations, resumeAnimations]);

  // Create or return singleton
  if (!globalOptimizer) {
    globalOptimizer = {
      pauseAnimations,
      resumeAnimations,
      get isPageLoaded() { return isPageLoaded.current; }
    };
  }

  return globalOptimizer;
};