import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getRouteImages } from '@/data/routeHeroMap';

const RouteImagePreloader = () => {
  const location = useLocation();

  useEffect(() => {
    const urls = getRouteImages(location.pathname);
    if (urls.length === 0) return;

    // Aggressively preload images with high priority for first 2
    urls.forEach((url, index) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      // High priority for first 2 images only
      if (index <= 1) {
        link.setAttribute('fetchpriority', 'high');
      }
      document.head.appendChild(link);
      
      // Also decode immediately for instant paint (all images)
      const img = new Image();
      img.src = url;
      if ('decode' in img && typeof img.decode === 'function') {
        img.decode().catch(() => {});
      }
    });
  }, [location.pathname]);

  return null;
};

export default RouteImagePreloader;
