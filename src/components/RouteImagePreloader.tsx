import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getRouteImages } from '@/data/routeHeroMap';

const RouteImagePreloader = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;

    const urls = getRouteImages(location.pathname);
    if (urls.length === 0) return;

    const run = () => {
      urls.slice(0, 1).forEach((url) => {
        const existing = document.querySelector(`link[rel="preload"][href="${url}"]`);
        if (existing) return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
      });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(run, { timeout: 5000 });
    } else {
      setTimeout(run, 5000);
    }
  }, [location.pathname]);

  return null;
};

export default RouteImagePreloader;
