import { homeHeroImages, cafeHeroImages, cocktailHeroImages, beerHeroImages, kitchenHeroImages, hallHeroImages, communityHeroImages, commonRoomHeroImages } from './heroImages';

// Map app routes to the first hero image used on that page
const routeFirstImage: Record<string, string | undefined> = {
  '/': homeHeroImages[0]?.src,
  '/cafe': cafeHeroImages[0]?.src,
  '/cocktails': cocktailHeroImages[0]?.src,
  '/beer': beerHeroImages[0]?.src,
  '/kitchens': kitchenHeroImages[0]?.src,
  '/hall': hallHeroImages[0]?.src,
  '/community': communityHeroImages[0]?.src,
  '/common-room': commonRoomHeroImages[0]?.src,
};

export const getRoutePreview = (path: string): string | null => {
  // Normalize to root segment paths we support (ignore subpaths and params)
  try {
    const url = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const first = '/' + (url.pathname.split('/').filter(Boolean)[0] ?? '');
    const key = first === '/' ? '/' : first;
    return routeFirstImage[key] ?? null;
  } catch {
    // Fallback if "path" is already a pathname like '/cafe'
    const first = '/' + (path.split('/').filter(Boolean)[0] ?? '');
    const key = first === '/' ? '/' : first;
    return routeFirstImage[key] ?? null;
  }
};
