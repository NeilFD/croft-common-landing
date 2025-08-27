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
    const trackMetrics = (metrics: WebVitalsMetrics) => {
      console.log('🎯 WEB VITALS:', metrics);
      
      // Track performance metrics
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          // Send to analytics if needed
          const performanceData = {
            timestamp: Date.now(),
            url: window.location.pathname,
            ...metrics
          };
          
          // Store in sessionStorage for now
          try {
            const existingMetrics = JSON.parse(sessionStorage.getItem('webVitals') || '[]');
            existingMetrics.push(performanceData);
            sessionStorage.setItem('webVitals', JSON.stringify(existingMetrics.slice(-10))); // Keep last 10
          } catch (error) {
            console.warn('Failed to store web vitals:', error);
          }
        });
      }
    };

    // Track Core Web Vitals
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
            metrics.lcp = entry.startTime;
            break;
          case 'first-input':
            metrics.fid = (entry as any).processingStart - entry.startTime;
            break;
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              metrics.cls = (metrics.cls || 0) + (entry as any).value;
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
    };
  }, []);

  return {
    getMetrics: () => {
      try {
        return JSON.parse(sessionStorage.getItem('webVitals') || '[]');
      } catch {
        return [];
      }
    }
  };
};