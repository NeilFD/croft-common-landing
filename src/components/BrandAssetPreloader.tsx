import { useEffect } from 'react';
import { BRAND_LOGO } from '@/data/brand';
import { preloadImages } from '@/hooks/useImagePreloader';

const BrandAssetPreloader = () => {
  useEffect(() => {
    // Preload critical brand assets immediately
    preloadImages([BRAND_LOGO]);
    
    // Create high-priority link preload for the logo
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = BRAND_LOGO;
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
    
    return () => {
      // Cleanup on unmount
      const existingLink = document.querySelector(`link[href="${BRAND_LOGO}"]`);
      if (existingLink) {
        document.head.removeChild(existingLink);
      }
    };
  }, []);

  return null;
};

export default BrandAssetPreloader;