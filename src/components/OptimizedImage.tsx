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
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // Set fetchpriority as a lowercase attribute to avoid React warnings
    if (priority && imgRef.current) {
      imgRef.current.setAttribute('fetchpriority', 'high');
    }
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!isLoaded && !hasError && (
        <Skeleton className="absolute inset-0 bg-muted/20" />
      )}
      
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? 'eager' : loading}
        decoding="async"
        sizes={sizes}
        draggable={false}
        style={objectPosition ? { objectPosition } : undefined}
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {hasError && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;