import { useEffect, useState } from 'react';

// Deduplication across session
const preloadedUrls = new Set<string>();
const appendedPreloads = new Set<string>();

interface UseImagePreloaderOptions {
  enabled?: boolean;
  priority?: boolean;
}

export const useImagePreloader = (imageUrls: string[], options: UseImagePreloaderOptions = {}) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!options.enabled && !options.priority) return;

    let isMounted = true;
    const uniqueUrls = Array.from(new Set(imageUrls));
    const imgs: HTMLImageElement[] = [];

    const preloadImages = async () => {
      const promises = uniqueUrls.map((url) => {
        // If we've already preloaded this URL in this session, mark as loaded and skip network
        if (preloadedUrls.has(url)) {
          setLoadedImages(prev => new Set([...prev, url]));
          return Promise.resolve(url);
        }

        return new Promise<string>((resolve) => {
          const img = new Image();
          imgs.push(img);
          let settled = false;

          const finalize = () => {
            if (settled) return;
            settled = true;
            preloadedUrls.add(url);
            if (!isMounted) return resolve(url);
            setLoadedImages(prev => new Set([...prev, url]));
            resolve(url);
          };

          img.onload = finalize;
          img.onerror = finalize;
          img.src = url;
          // @ts-ignore - decode may not exist on all browsers
          if ((img as any).decode) {
            // @ts-ignore
            (img as any).decode().then(finalize).catch(finalize);
          }
        });
      });

      try {
        await Promise.all(promises);
      } catch (error) {
        console.warn('Some images failed to preload:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    preloadImages();

    return () => {
      isMounted = false;
      // Best-effort cancel further work
      imgs.forEach((img) => {
        img.onload = null as any;
        img.onerror = null as any;
        try { img.src = ''; } catch {}
      });
    };
  }, [imageUrls, options.enabled, options.priority]);

  return {
    loadedImages,
    loading,
    isImageLoaded: (url: string) => loadedImages.has(url)
  };
};

export const preloadImages = (urls: string[]) => {
  urls.forEach(url => {
    if (appendedPreloads.has(url)) return;
    appendedPreloads.add(url);
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
};