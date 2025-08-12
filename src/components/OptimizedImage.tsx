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
}

const OptimizedImage = ({ 
  src, 
  alt, 
  className, 
  priority = false, 
  onLoad,
  loading = 'lazy',
  sizes = '100vw',
  objectPosition
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);

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
      return url.pathname + url.search + url.hash;
    } catch {
      // Fallback: naive append
      const sep = u.includes('?') ? '&' : '?';
      return `${u}${sep}sw-bypass=1&r=${r}&ts=${Date.now()}`;
    }
  };

  const computedSrc = retryCount > 0 ? buildBypassUrl(src, retryCount) : src;

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    // Retry up to 2 times with backoff
    if (retryCount < 2) {
      const delay = retryCount === 0 ? 600 : 1500;
      window.setTimeout(() => setRetryCount((c) => c + 1), delay);
      return;
    }
    // After retries, keep skeleton hidden state (do not flip to an error panel)
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!isLoaded && (
        <Skeleton className="absolute inset-0 bg-muted/20" />
      )}
      
      <img
        ref={imgRef}
        src={computedSrc}
        alt={alt}
        loading={priority ? 'eager' : loading}
        decoding="async"
        sizes={sizes}
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
