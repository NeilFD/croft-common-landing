import { useEffect } from 'react';

interface WebVitalsMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

export const useWebVitals = () => {
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    let metricsQueue: WebVitalsMetrics[] = [];
    
    const trackMetrics = (metrics: WebVitalsMetrics) => {
      metricsQueue.push(metrics);
      
      // Debounce metrics tracking to reduce overhead
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (metricsQueue.length === 0) return;
        
        // Only log significant metrics
        const significantMetrics = metricsQueue[metricsQueue.length - 1];
        if (significantMetrics.lcp && significantMetrics.lcp > 4000) {
          console.warn('⚠️ Poor LCP:', significantMetrics.lcp + 'ms');
        }
        
        // Store efficiently
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            try {
              const performanceData = {
                timestamp: Date.now(),
                url: window.location.pathname,
                ...significantMetrics
              };
              
              sessionStorage.setItem('lastWebVitals', JSON.stringify(performanceData));
            } catch (error) {
              // Silently fail to avoid console noise
            }
          });
        }
        
        metricsQueue = [];
      }, 1000);
    };

    // Track Core Web Vitals with reduced frequency
    const observer = new PerformanceObserver((list) => {
      const metrics: WebVitalsMetrics = {};
      
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              metrics.fcp = entry.startTime;
            }
            break;
          case 'largest-contentful-paint':
            // Only track if significantly poor
            if (entry.startTime > 2500) {
              metrics.lcp = entry.startTime;
            }
            break;
          case 'first-input':
            const fid = (entry as any).processingStart - entry.startTime;
            if (fid > 100) { // Only track poor FID
              metrics.fid = fid;
            }
            break;
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              const clsValue = (entry as any).value;
              if (clsValue > 0.1) { // Only track significant shifts
                metrics.cls = (metrics.cls || 0) + clsValue;
              }
            }
            break;
          case 'navigation':
            metrics.ttfb = (entry as any).responseStart;
            break;
        }
      }

      if (Object.keys(metrics).length > 0) {
        trackMetrics(metrics);
      }
    });

    // Observe performance metrics
    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] });
    } catch (error) {
      console.warn('Performance observer not supported:', error);
    }

    return () => {
      observer.disconnect();
      clearTimeout(debounceTimer);
    };
  }, []);

  return {
    getMetrics: () => {
      try {
        return JSON.parse(sessionStorage.getItem('lastWebVitals') || '{}');
      } catch {
        return {};
      }
    }
  };
};