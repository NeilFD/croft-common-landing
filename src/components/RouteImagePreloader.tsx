import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getRoutePreview } from '@/data/routeHeroMap';
import { preloadImages } from '@/hooks/useImagePreloader';

const RouteImagePreloader = () => {
  const location = useLocation();

  useEffect(() => {
    const url = getRoutePreview(location.pathname);
    if (!url) return;

    // Hint the browser to fetch early
    preloadImages([url]);

    // Decode ASAP to ensure it's ready before carousels autoplay
    const img = new Image();
    img.src = url;
    if ('decode' in img) {
      // @ts-ignore
      img.decode().catch(() => {});
    }
  }, [location.pathname]);

  return null;
};

export default RouteImagePreloader;
