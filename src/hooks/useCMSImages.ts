import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HeroImage } from '@/data/heroImages';

interface CMSImage {
  id: string;
  image_url: string;
  alt_text?: string;
  description?: string;
  sort_order: number;
  metadata?: any; // Using any for JSON compatibility
}

interface UseCMSImagesOptions {
  fallbackImages?: HeroImage[];
}

// Cache for preloaded images to avoid redundant fetches
const imagePreloadCache = new Set<string>();

export const useCMSImages = (
  page: string, 
  carouselName: string, 
  options: UseCMSImagesOptions = {}
) => {
  const { fallbackImages = [] } = options;

  const { data: images = fallbackImages, isLoading: loading, error } = useQuery({
    queryKey: ['cms-images', page, carouselName],
    initialData: fallbackImages, // Return fallbacks immediately for instant first paint
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('cms_images')
        .select('*')
        .eq('page', page)
        .eq('carousel_name', carouselName)
        .eq('published', true)
        .order('sort_order', { ascending: true });

      if (fetchError) {
        console.error('Error fetching CMS images:', fetchError);
        throw fetchError;
      }

      if (!data || data.length === 0) {
        return fallbackImages;
      }

      // Transform CMS data to HeroImage format with validation
      const transformedImages: HeroImage[] = [];
      
      for (const item of data) {
        // Validate image URL exists and is accessible
        if (item.image_url && item.image_url.trim()) {
          const metadata = item.metadata as any;
          transformedImages.push({
            src: item.image_url,
            type: metadata?.type || 'dark',
            overlay: metadata?.overlay || 'bg-void/20', // Default overlay for CMS images
            backgroundPosition: metadata?.backgroundPosition,
            backgroundSize: metadata?.backgroundSize,
          });
        }
      }

      if (transformedImages.length === 0) {
        return fallbackImages;
      }

      // For home/main_hero, validate images and guarantee 4 slides
      const isHomeMainHero = (['home', 'index'].includes(page) && carouselName === 'main_hero');

      const isCrossOrigin = (u: string): boolean => {
        try {
          if (typeof window === 'undefined') return false;
          const url = new URL(u, window.location.origin);
          return url.origin !== window.location.origin;
        } catch {
          return true;
        }
      };

      const decodeWithTimeout = (src: string, timeoutMs = 2500): Promise<boolean> => {
        return new Promise((resolve) => {
          try {
            const img = new Image();
            let settled = false;
            const done = (ok: boolean) => {
              if (settled) return;
              settled = true;
              resolve(ok);
              cleanup();
            };
            const cleanup = () => {
              img.onload = null;
              img.onerror = null;
            };
            const timer = setTimeout(() => done(false), timeoutMs);
            img.onload = () => {
              clearTimeout(timer);
              try {
                if ('decode' in img && typeof (img as any).decode === 'function') {
                  (img as any).decode().then(() => done(true)).catch(() => done(true));
                } else {
                  done(true);
                }
              } catch {
                done(true);
              }
            };
            img.onerror = () => {
              clearTimeout(timer);
              done(false);
            };
            img.src = src;
          } catch {
            resolve(false);
          }
        });
      };

      if (isHomeMainHero) {
        const validated: HeroImage[] = await Promise.all(
          transformedImages.map(async (img, idx) => {
            const cross = isCrossOrigin(img.src);
            let decodeOk = false;
            try { decodeOk = await decodeWithTimeout(img.src, 2500); } catch { decodeOk = false; }
            const valid = !cross && decodeOk;
            if (!valid) {
              const fallback = fallbackImages[idx];
              if (fallback?.src) {
                console.warn('[CMSImages] Replacing invalid hero image with fallback', {
                  index: idx,
                  src: img.src,
                  cross,
                  decodeOk,
                  fallback: fallback.src
                });
                return { ...fallback };
              }
            }
            return img;
          })
        );

        let finalImages = validated.filter(Boolean);

        // Ensure at least 4 slides
        const minCount = 4;
        if (finalImages.length < minCount) {
          for (let i = 0; i < fallbackImages.length && finalImages.length < minCount; i++) {
            finalImages.push(fallbackImages[i]);
          }
        }

        return finalImages;
      }

      return transformedImages;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Phase 3: Preload images immediately when available (whether from fallback or CMS)
  useEffect(() => {
    if (!images || images.length === 0) return;

    const isHomeMainHero = (['home', 'index'].includes(page) && carouselName === 'main_hero');
    const preloadCount = isHomeMainHero ? 4 : 2;

    images.slice(0, preloadCount).forEach((img, i) => {
      if (!imagePreloadCache.has(img.src)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = img.src;
        if (i <= 1) link.setAttribute('fetchpriority', 'high');
        document.head.appendChild(link);
        imagePreloadCache.add(img.src);
      }
      // Also decode to make it paint-ready
      const pre = new Image();
      pre.src = img.src;
      if ('decode' in pre && typeof pre.decode === 'function') {
        pre.decode().catch(() => {});
      }
    });
  }, [images, page, carouselName]);

  return { images, loading, error: error?.message || null };
};