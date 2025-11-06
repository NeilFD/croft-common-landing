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
  instantTransition?: boolean;
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
  mobileOptimized = false,
  instantTransition = false
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isBroken, setIsBroken] = useState(false);
  const [forceBypass, setForceBypass] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mobile optimization detection (safe for SSR)
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const connection = typeof window !== 'undefined' ? (navigator as any).connection : null;
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
    setIsBroken(false);
    setForceBypass(false);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, [src]);

  const buildBypassUrl = (u: string, r: number) => {
    try {
      const url = new URL(u, typeof window !== 'undefined' ? window.location.origin : undefined);
      const isCrossOrigin = typeof window !== 'undefined' ? url.origin !== window.location.origin : false;

      // Never mutate cross-origin URLs (avoid breaking signed/CDN links)
      if (isCrossOrigin) {
        return u;
      }

      url.searchParams.set('sw-bypass', '1');
      url.searchParams.set('r', String(r));
      url.searchParams.set('ts', String(Date.now()));
      
      // Do not add extra mobile/compress params for same-origin static assets
      return url.toString();
    } catch {
      // Fallback: naive append without extra params
      const sep = u.includes('?') ? '&' : '?';
      return `${u}${sep}sw-bypass=1&r=${r}&ts=${Date.now()}`;
    }
  };

  // Always use original URL on first attempt; apply bypass on retries
  const useOriginalOnFirstTry = retryCount === 0 && !forceBypass;
  const computedSrc = useOriginalOnFirstTry ? src : buildBypassUrl(src, retryCount);
  
  // Generate mobile-optimized sizes attribute
  const mobileSizes = mobileOptimized 
    ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
    : sizes;

  const handleLoad = () => {
    setIsLoaded(true);
    setIsBroken(false);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    onLoad?.();
  };

  const handleError = (error: any) => {
    // Priority images: one immediate cache-bypass retry, then fail
    if (priority && !forceBypass) {
      console.warn('⚠️ [OptimizedImage] Priority image failed, retrying with cache bypass:', {
        failedUrl: computedSrc,
        originalSrc: src,
        currentSrc: (error?.target as HTMLImageElement)?.currentSrc,
        priority: true,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      });
      setForceBypass(true);
      setRetryCount(1);
      setIsBroken(false);
      return;
    }
    
    if (priority && forceBypass) {
      // Bypass retry also failed
      setIsBroken(true);
      console.error('❌ [OptimizedImage] Priority image permanently failed (bypass also failed):', {
        failedUrl: computedSrc,
        originalSrc: src,
        currentSrc: (error?.target as HTMLImageElement)?.currentSrc,
        priority: true,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      });
      return;
    }
    
    // Only log critical errors for non-priority, not every retry
    if (retryCount === 0) {
      console.warn('🚨 [OptimizedImage] Failed to load:', {
        failedUrl: computedSrc,
        originalSrc: src,
        currentSrc: (error?.target as HTMLImageElement)?.currentSrc,
        priority: false,
        error: error?.target?.error || 'Unknown error'
      });
    }
    
    // Circuit breaker - if retries exceed limit, mark as permanently broken
    if (retryCount >= 2) {
      setIsBroken(true);
      console.error('❌ [OptimizedImage] Permanently failed:', {
        failedUrl: computedSrc,
        originalSrc: src,
        currentSrc: (error?.target as HTMLImageElement)?.currentSrc,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      });
      return;
    }
    
    // Exponential backoff: 500ms, 2000ms
    const delay = retryCount === 0 ? 500 : 2000;
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    retryTimeoutRef.current = setTimeout(() => {
      setRetryCount((c) => c + 1);
      retryTimeoutRef.current = null;
    }, delay);
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!isLoaded && !priority && (
        <Skeleton className="absolute inset-0 bg-muted/20 pointer-events-none" />
      )}
      
      {isBroken && !isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/10 pointer-events-none">
          <div className="text-center text-muted-foreground text-sm">
            <div className="text-2xl mb-2">📷</div>
            <div>Image unavailable</div>
          </div>
        </div>
      )}
      
      {!isBroken && (
        <img
        key={`${computedSrc}-${retryCount}`}
        ref={imgRef}
        src={computedSrc}
        alt={alt}
        loading={priority ? 'eager' : loading}
        decoding={priority ? 'auto' : 'async'}
        sizes={mobileSizes}
        draggable={false}
        style={objectPosition ? { objectPosition } : undefined}
        className={cn(
          'absolute inset-0 w-full h-full object-cover transition-opacity',
          instantTransition || priority ? 'duration-0' : 'duration-500',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
