import { useEffect, useState } from 'react';

interface UseImagePreloaderOptions {
  enabled?: boolean;
  priority?: boolean;
}

export const useImagePreloader = (imageUrls: string[], options: UseImagePreloaderOptions = {}) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!options.enabled && !options.priority) return;

    const preloadImages = async () => {
      const promises = imageUrls.map((url) => {
        return new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            setLoadedImages(prev => new Set([...prev, url]));
            resolve(url);
          };
          img.onerror = reject;
          img.src = url;
        });
      });

      try {
        await Promise.all(promises);
      } catch (error) {
        console.warn('Some images failed to preload:', error);
      } finally {
        setLoading(false);
      }
    };

    preloadImages();
  }, [imageUrls, options.enabled, options.priority]);

  return {
    loadedImages,
    loading,
    isImageLoaded: (url: string) => loadedImages.has(url)
  };
};

export const preloadImages = (urls: string[]) => {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
};