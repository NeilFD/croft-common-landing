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

    // Detect mobile and connection for smart loading
    const isMobile = window.innerWidth < 768;
    const connection = (navigator as any).connection;
    const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
    
    // Aggressive loading for home page - load all images immediately
    const maxConcurrent = uniqueUrls.length;
    const urlsToLoad = uniqueUrls;

    const preloadImages = async () => {
      // Initialize loaded images with already preloaded URLs
      const alreadyLoaded = uniqueUrls.filter(url => preloadedUrls.has(url));
      if (alreadyLoaded.length > 0 && isMounted) {
        // Use setTimeout to avoid setState during render
        setTimeout(() => {
          if (isMounted) setLoadedImages(new Set(alreadyLoaded));
        }, 0);
      }

      const promises = urlsToLoad.map((url) => {
        // If already preloaded, skip network request
        if (preloadedUrls.has(url)) {
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
            
            // Safe state update - only when mounted and not during render
            setLoadedImages(prev => new Set([...prev, url]));
            resolve(url);
          };

          img.onload = finalize;
          img.onerror = finalize;
          img.src = url;
          
          // Use decode for better performance when available
          if ('decode' in img && typeof img.decode === 'function') {
            img.decode().then(finalize).catch(finalize);
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
      // Clean up image references
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

export const preloadImages = (urls: string[], highPriority = false) => {
  urls.forEach(url => {
    if (appendedPreloads.has(url)) return;
    appendedPreloads.add(url);
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    if (highPriority) {
      link.setAttribute('fetchpriority', 'high');
    }
    document.head.appendChild(link);
  });
};