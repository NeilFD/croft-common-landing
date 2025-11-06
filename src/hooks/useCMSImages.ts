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

      // Preload priority images immediately (first 2 high, up to 4 for home/main_hero)
      const preloadCount = (['home', 'index'].includes(page) && carouselName === 'main_hero') ? 4 : 2;
      transformedImages.slice(0, preloadCount).forEach((img, i) => {
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

      return transformedImages;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return { images, loading, error: error?.message || null };
};