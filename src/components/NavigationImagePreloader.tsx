import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  cafeHeroImages, 
  cocktailHeroImages, 
  beerHeroImages, 
  kitchenHeroImages, 
  hallHeroImages, 
  communityHeroImages 
} from '@/data/heroImages';

// Global preload cache to track what's already preloaded
const globalPreloadCache = new Set<string>();

const NavigationImagePreloader = () => {
  const location = useLocation();

  // Phase 1: Aggressively preload first image from every carousel on app init
  useEffect(() => {
    const allFirstImages = [
      cafeHeroImages[0]?.src,
      cocktailHeroImages[0]?.src,
      beerHeroImages[0]?.src,
      kitchenHeroImages[0]?.src,
      hallHeroImages[0]?.src,
      communityHeroImages[0]?.src,
    ].filter(Boolean) as string[];

    allFirstImages.forEach((url) => {
      if (globalPreloadCache.has(url)) return;

      // Create preload link with high priority
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);

      // Decode immediately to make paint-ready
      const img = new Image();
      img.src = url;
      if ('decode' in img && typeof img.decode === 'function') {
        img.decode().catch(() => {});
      }

      globalPreloadCache.add(url);
    });
  }, []); // Only once on mount

  // Phase 2: Hover preloading for desktop navigation
  useEffect(() => {
    const routeImageMap: Record<string, string[]> = {
      '/cafe': [cafeHeroImages[0]?.src, cafeHeroImages[1]?.src].filter(Boolean) as string[],
      '/cocktails': [cocktailHeroImages[0]?.src, cocktailHeroImages[1]?.src].filter(Boolean) as string[],
      '/beer': [beerHeroImages[0]?.src, beerHeroImages[1]?.src].filter(Boolean) as string[],
      '/kitchens': [kitchenHeroImages[0]?.src, kitchenHeroImages[1]?.src].filter(Boolean) as string[],
      '/hall': [hallHeroImages[0]?.src, hallHeroImages[1]?.src].filter(Boolean) as string[],
      '/community': [communityHeroImages[0]?.src, communityHeroImages[1]?.src].filter(Boolean) as string[],
    };

    const handleNavHover = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      if (!link) return;

      const path = link.getAttribute('href');
      if (!path) return;

      const images = routeImageMap[path];
      if (!images) return;

      // Preload first 2 images on hover
      images.forEach((url, index) => {
        if (globalPreloadCache.has(url)) return;

        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'image';
        preloadLink.href = url;
        if (index === 0) {
          preloadLink.setAttribute('fetchpriority', 'high');
        }
        document.head.appendChild(preloadLink);

        // Decode immediately
        const img = new Image();
        img.src = url;
        if ('decode' in img && typeof img.decode === 'function') {
          img.decode().catch(() => {});
        }

        globalPreloadCache.add(url);
      });
    };

    // Add hover listeners to navigation
    document.addEventListener('mouseover', handleNavHover);
    document.addEventListener('touchstart', handleNavHover, { passive: true });

    return () => {
      document.removeEventListener('mouseover', handleNavHover);
      document.removeEventListener('touchstart', handleNavHover);
    };
  }, []);

  // Phase 3: IntersectionObserver for mobile - preload when nav is visible
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth >= 768) return; // Desktop already has hover

    const allSecondaryImages = [
      cafeHeroImages[1]?.src,
      cocktailHeroImages[1]?.src,
      beerHeroImages[1]?.src,
      kitchenHeroImages[1]?.src,
      hallHeroImages[1]?.src,
      communityHeroImages[1]?.src,
    ].filter(Boolean) as string[];

    // Preload secondary images when mobile nav becomes visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            allSecondaryImages.forEach((url) => {
              if (globalPreloadCache.has(url)) return;

              const link = document.createElement('link');
              link.rel = 'preload';
              link.as = 'image';
              link.href = url;
              document.head.appendChild(link);

              const img = new Image();
              img.src = url;
              if ('decode' in img && typeof img.decode === 'function') {
                img.decode().catch(() => {});
              }

              globalPreloadCache.add(url);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe navigation elements
    const navElements = document.querySelectorAll('nav, [role="navigation"]');
    navElements.forEach((nav) => observer.observe(nav));

    return () => observer.disconnect();
  }, [location.pathname]);

  return null;
};

export default NavigationImagePreloader;
