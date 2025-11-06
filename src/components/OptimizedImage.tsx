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
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
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

  // Priority images skip retry complexity for instant display
  const computedSrc = (priority || retryCount === 0) ? src : buildBypassUrl(src, retryCount);
  
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
    // Priority images don't retry - fail fast
    if (priority) {
      setIsBroken(true);
      console.error('❌ [OptimizedImage] Priority image failed:', src);
      return;
    }
    
    // Only log critical errors, not every retry
    if (retryCount === 0) {
      console.warn('🚨 [OptimizedImage] Failed to load:', {
        src: computedSrc,
        originalSrc: src,
        error: error?.target?.error || 'Unknown error'
      });
    }
    
    // Circuit breaker - if retries exceed limit, mark as permanently broken
    if (retryCount >= 2) {
      setIsBroken(true);
      console.error('❌ [OptimizedImage] Permanently failed:', src);
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
      {!isLoaded && (
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
        ref={imgRef}
        src={computedSrc}
        alt={alt}
        loading={priority ? 'eager' : loading}
        decoding="async"
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
