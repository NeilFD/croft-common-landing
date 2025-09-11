import { useState, useEffect } from 'react';
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

export const useCMSImages = (
  page: string, 
  carouselName: string, 
  options: UseCMSImagesOptions = {}
) => {
  const [images, setImages] = useState<HeroImage[]>(options.fallbackImages || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('cms_images')
          .select('*')
          .eq('page', page)
          .eq('carousel_name', carouselName)
          .eq('published', true)
          .order('sort_order', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        if (data && data.length > 0) {
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

          if (transformedImages.length > 0) {
            setImages(transformedImages);
          } else if (options.fallbackImages) {
            // Use fallback if no valid CMS images
            setImages(options.fallbackImages);
          }
        } else if (options.fallbackImages) {
          // Use fallback images if no CMS images found
          setImages(options.fallbackImages);
        }
      } catch (err) {
        console.error('Error fetching CMS images:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch images');
        
        // Use fallback images on error
        if (options.fallbackImages) {
          setImages(options.fallbackImages);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [page, carouselName, options.fallbackImages]);

  return { images, loading, error };
};