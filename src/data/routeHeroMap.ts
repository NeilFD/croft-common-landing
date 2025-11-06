import { homeHeroImages, cafeHeroImages, cocktailHeroImages, beerHeroImages, kitchenHeroImages, hallHeroImages, communityHeroImages, commonRoomHeroImages } from './heroImages';

// Map app routes to hero images for aggressive preloading (all 4 for home, first 2 for others)
const routeImages: Record<string, string[]> = {
  '/': [homeHeroImages[0]?.src, homeHeroImages[1]?.src, homeHeroImages[2]?.src, homeHeroImages[3]?.src].filter(Boolean) as string[],
  '/cafe': [cafeHeroImages[0]?.src, cafeHeroImages[1]?.src].filter(Boolean) as string[],
  '/cocktails': [cocktailHeroImages[0]?.src, cocktailHeroImages[1]?.src].filter(Boolean) as string[],
  '/beer': [beerHeroImages[0]?.src, beerHeroImages[1]?.src].filter(Boolean) as string[],
  '/kitchens': [kitchenHeroImages[0]?.src, kitchenHeroImages[1]?.src].filter(Boolean) as string[],
  '/hall': [hallHeroImages[0]?.src, hallHeroImages[1]?.src].filter(Boolean) as string[],
  '/community': [communityHeroImages[0]?.src, communityHeroImages[1]?.src].filter(Boolean) as string[],
  '/common-room': [commonRoomHeroImages[0]?.src].filter(Boolean) as string[],
};

export const getRouteImages = (path: string): string[] => {
  // Normalize to root segment paths we support (ignore subpaths and params)
  try {
    const url = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const first = '/' + (url.pathname.split('/').filter(Boolean)[0] ?? '');
    const key = first === '/' ? '/' : first;
    return routeImages[key] ?? [];
  } catch {
    // Fallback if "path" is already a pathname like '/cafe'
    const first = '/' + (path.split('/').filter(Boolean)[0] ?? '');
    const key = first === '/' ? '/' : first;
    return routeImages[key] ?? [];
  }
};

// Backwards compatibility - return first image only
export const getRoutePreview = (path: string): string | null => {
  const images = getRouteImages(path);
  return images[0] ?? null;
};
