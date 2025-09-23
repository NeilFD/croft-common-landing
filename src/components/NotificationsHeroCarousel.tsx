import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import OptimizedImage from './OptimizedImage';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { useIsMobile, useConnectionSpeed } from '@/hooks/use-mobile';
import { homeHeroImages as fallbackHeroImages } from '@/data/heroImages';
import { useCMSImages } from '@/hooks/useCMSImages';
import CroftLogo from './CroftLogo';

const NotificationsHeroCarousel = () => {
  const isMobile = useIsMobile();
  const { isSlowConnection } = useConnectionSpeed();
  
  // Fetch CMS images with fallback to static images (same as home page)
  const { images: heroImages, loading: imagesLoading } = useCMSImages(
    'index', 
    'main_hero', 
    { fallbackImages: fallbackHeroImages }
  );
  
  // Optimize autoplay delay for mobile/slow connections
  const autoplayDelay = isMobile || isSlowConnection ? 6000 : 4000;
  const autoplay = useRef(Autoplay({ delay: autoplayDelay, stopOnInteraction: false }));
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      duration: isMobile ? 20 : 30 // Faster transitions on mobile
    },
    [autoplay.current]
  );

  const [currentSlide, setCurrentSlide] = useState(0);

  // Smart image loading - prioritize first 2 images on mobile
  const imageUrls = heroImages.map(img => img.src);
  const priorityUrls = isMobile ? imageUrls.slice(0, 2) : imageUrls;
  const { loading: imagePreloadLoading } = useImagePreloader(priorityUrls, { enabled: !imagesLoading, priority: true });
  const [isFirstReady, setIsFirstReady] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentSlide(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    
    // Start autoplay immediately without waiting for image decode
    const timeoutId = setTimeout(() => {
      setIsFirstReady(true);
      try { 
        autoplay.current?.play?.(); 
      } catch (e) {
        // Silent fail
      }
    }, 100); // Much faster start
    
    return () => clearTimeout(timeoutId);
  }, [emblaApi]);

  return (
    <div className="embla-carousel relative min-h-screen overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {heroImages.map((image, index) => (
          <div 
            key={index}
            className="flex-[0_0_100%] relative min-h-screen"
          >
            {/* Optimized Background Image */}
            <OptimizedImage
              src={image.src}
              alt={`Hero image ${index + 1}`}
              className="min-h-screen"
              priority={index === 0}
              loading={index === 0 ? 'eager' : 'lazy'}
              sizes="100vw"
              mobileOptimized={true}
            />
            {/* Subtle overlay for text readability */}
            <div className={`absolute inset-0 ${image.overlay} transition-all duration-1000`}></div>
          </div>
        ))}
      </div>

      {/* Fixed watermark overlay */}
      <div className="absolute inset-0 flex items-center justify-center mt-16 z-10 pointer-events-none" aria-hidden data-watermark="true">
        <CroftLogo
          className="w-[27.5rem] h-[27.5rem] sm:w-[30rem] sm:h-[30rem] md:w-[32.5rem] md:h-[32.5rem] lg:w-[35rem] lg:h-[35rem] opacity-30 object-contain transition-all duration-500 hover:opacity-70 invert pointer-events-none"
          enableDevPanel={false}
          interactive={false}
        />
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex flex-col items-center">
          <div className="w-px h-16 bg-accent-pink"></div>
          <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-accent-pink mt-1"></div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 right-8 flex space-x-2 z-20">
        {heroImages.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-background' : 'bg-background/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationsHeroCarousel;