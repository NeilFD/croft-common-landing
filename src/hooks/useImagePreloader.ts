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
    
    // Limit concurrent loading on mobile/slow connections
    const maxConcurrent = (isMobile || isSlowConnection) ? 2 : uniqueUrls.length;
    const urlsToLoad = uniqueUrls.slice(0, maxConcurrent);

    const preloadImages = async () => {
      // Initialize loaded images with already preloaded URLs
      const alreadyLoaded = uniqueUrls.filter(url => preloadedUrls.has(url));
      if (alreadyLoaded.length > 0 && isMounted) {
        setLoadedImages(new Set(alreadyLoaded));
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
        
        // Load remaining images progressively on mobile
        if (isMobile && uniqueUrls.length > maxConcurrent) {
          setTimeout(() => {
            if (isMounted) {
              const remainingUrls = uniqueUrls.slice(maxConcurrent);
              remainingUrls.forEach(url => {
                if (!preloadedUrls.has(url)) {
                  const img = new Image();
                  img.onload = () => {
                    preloadedUrls.add(url);
                    if (isMounted) {
                      setLoadedImages(prev => new Set([...prev, url]));
                    }
                  };
                  img.src = url;
                }
              });
            }
          }, 1000);
        }
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