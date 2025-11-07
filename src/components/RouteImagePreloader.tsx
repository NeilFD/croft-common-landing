import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getRouteImages } from '@/data/routeHeroMap';

const RouteImagePreloader = () => {
  const location = useLocation();

  useEffect(() => {
    const urls = getRouteImages(location.pathname);
    if (urls.length === 0) return;

    // Phase 5: Preload ALL carousel images on route change
    // First 2 images: high priority + immediate decode for instant paint
    // Remaining images: normal priority for smooth scrolling without grey flash
    urls.forEach((url, index) => {
      // Skip if already preloaded
      const existing = document.querySelector(`link[rel="preload"][href="${url}"]`);
      if (existing) return;
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      // High priority for first 2 images only
      if (index <= 5) {
        link.setAttribute('fetchpriority', 'high');
      }
      document.head.appendChild(link);
      
      // Decode first 2 immediately for instant paint
      if (index <= 5) {
        const img = new Image();
        img.src = url;
        if ('decode' in img && typeof img.decode === 'function') {
          img.decode().catch(() => {});
        }
      }
    });
  }, [location.pathname]);

  return null;
};

export default RouteImagePreloader;
