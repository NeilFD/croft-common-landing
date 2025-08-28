import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  objectPosition?: string;
  mobileOptimized?: boolean;
}

const OptimizedImage = ({ 
  src, 
  alt, 
  className, 
  priority = false, 
  onLoad,
  loading = 'lazy',
  sizes = '100vw',
  objectPosition,
  mobileOptimized = false
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);
  
  // Mobile optimization detection
  const isMobile = window.innerWidth < 768;
  const connection = (navigator as any).connection;
  const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');

  useEffect(() => {
    // Set fetchpriority as a lowercase attribute to avoid React warnings
    if (priority && imgRef.current) {
      imgRef.current.setAttribute('fetchpriority', 'high');
    }
  }, [priority]);

  // Reset when src changes
  useEffect(() => {
    setIsLoaded(false);
    setRetryCount(0);
  }, [src]);

  const buildBypassUrl = (u: string, r: number) => {
    try {
      const url = new URL(u, window.location.origin);
      url.searchParams.set('sw-bypass', '1');
      url.searchParams.set('r', String(r));
      url.searchParams.set('ts', String(Date.now()));
      
      // Add mobile optimization hints
      if (mobileOptimized && (isMobile || isSlowConnection)) {
        url.searchParams.set('mobile', '1');
        url.searchParams.set('compress', '1');
      }
      
      return url.pathname + url.search + url.hash;
    } catch {
      // Fallback: naive append
      const sep = u.includes('?') ? '&' : '?';
      const mobileParams = mobileOptimized && (isMobile || isSlowConnection) ? '&mobile=1&compress=1' : '';
      return `${u}${sep}sw-bypass=1&r=${r}&ts=${Date.now()}${mobileParams}`;
    }
  };

  const computedSrc = retryCount > 0 ? buildBypassUrl(src, retryCount) : src;
  
  // Generate mobile-optimized sizes attribute
  const mobileSizes = mobileOptimized 
    ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
    : sizes;

  const handleLoad = () => {
    console.log('✅ [OptimizedImage] Successfully loaded:', src);
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = (error: any) => {
    console.error('🚨 [OptimizedImage] Failed to load:', {
      src: computedSrc,
      originalSrc: src,
      retryCount,
      error: error?.target?.error || 'Unknown error'
    });
    
    // Retry up to 2 times with backoff
    if (retryCount < 2) {
      const delay = retryCount === 0 ? 600 : 1500;
      console.log(`🔄 [OptimizedImage] Retrying in ${delay}ms (attempt ${retryCount + 1}/2)`);
      window.setTimeout(() => setRetryCount((c) => c + 1), delay);
      return;
    }
    console.error('❌ [OptimizedImage] Max retries exceeded for:', src);
    // After retries, keep skeleton hidden state (do not flip to an error panel)
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!isLoaded && (
        <Skeleton className="absolute inset-0 bg-muted/20" />
      )}
      
      {retryCount >= 2 && !isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
          <div className="text-center text-muted-foreground text-sm">
            <div className="text-2xl mb-2">📷</div>
            <div>Image unavailable</div>
          </div>
        </div>
      )}
      
      <img
        ref={imgRef}
        src={computedSrc}
        alt={alt}
        loading={priority ? 'eager' : loading}
        decoding="async"
        sizes={mobileSizes}
        draggable={false}
        style={objectPosition ? { objectPosition } : undefined}
        className={cn(
          'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export default OptimizedImage;
