import { useEffect, useRef } from 'react';

interface PerformanceOptimizer {
  pauseAnimations: () => void;
  resumeAnimations: () => void;
  isPageLoaded: boolean;
}

export const usePerformanceOptimizer = (): PerformanceOptimizer => {
  const isPageLoaded = useRef(false);
  const animationElements = useRef<HTMLElement[]>([]);

  const pauseAnimations = () => {
    // Find all elements with animations
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
  };

  const resumeAnimations = () => {
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
  };

  useEffect(() => {
    // Track when page is fully loaded
    const handleLoad = () => {
      isPageLoaded.current = true;
      console.log('🎯 PERF: Page fully loaded, resuming animations');
      resumeAnimations();
    };

    // Start with animations paused during initial load
    if (document.readyState !== 'complete') {
      pauseAnimations();
      window.addEventListener('load', handleLoad);
    } else {
      isPageLoaded.current = true;
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  return {
    pauseAnimations,
    resumeAnimations,
    isPageLoaded: isPageLoaded.current
  };
};