import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import MenuButton from './MenuButton';
import OptimizedImage from './OptimizedImage';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { homeMenu } from '@/data/menuData';
import { homeHeroImages as heroImages } from '@/data/heroImages';
import BookFloatingButton from './BookFloatingButton';
import { ArrowBox } from '@/components/ui/ArrowBox';
import { BRAND_LOGO } from '@/data/brand';
const HeroCarousel = () => {
  const autoplay = useRef(Autoplay({ delay: 4000, stopOnInteraction: false }));
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      duration: 30 // Smooth transitions
    },
    [autoplay.current]
  );

  const [currentSlide, setCurrentSlide] = useState(0);

  // Images provided by shared data module

  const imageUrls = heroImages.map(img => img.src);
  const { loading: imagesLoading } = useImagePreloader(imageUrls, { enabled: true, priority: true });
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
    const firstUrl = heroImages[0]?.src;
    let cancelled = false;
    if (autoplay.current && emblaApi) {
      try { autoplay.current.stop(); } catch {}
    }
    if (!firstUrl) {
      setIsFirstReady(true);
      try { autoplay.current?.play?.(); } catch {}
      return;
    }
    const img = new Image();
    img.src = firstUrl;
    const proceed = () => {
      if (cancelled) return;
      setIsFirstReady(true);
      try { autoplay.current?.play?.(); } catch {}
    };
    if ('decode' in img) {
      // @ts-ignore
      img.decode().then(proceed).catch(proceed);
    } else {
      img.onload = proceed;
      img.onerror = proceed;
    }
    return () => { cancelled = true; };
  }, [emblaApi]);

  const currentImage = heroImages[currentSlide];

  return (
    <div className="relative min-h-screen overflow-hidden" ref={emblaRef}>
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
            />
            {/* Subtle overlay for text readability */}
            <div className={`absolute inset-0 ${image.overlay} transition-all duration-1000`}></div>
          </div>
        ))}
      </div>

      {/* Fixed watermark overlay */}
      <div className="absolute inset-0 flex items-center justify-center mt-16 z-10">
        <img 
          src={BRAND_LOGO}
          alt="Croft Common Watermark"
          className="w-[22rem] h-[22rem] sm:w-[24rem] sm:h-[24rem] md:w-[26rem] md:h-[26rem] lg:w-[28rem] lg:h-[28rem] opacity-30 object-contain transition-all duration-500 hover:opacity-70 cursor-pointer"
          style={{ 
            filter: 'invert(1)'
          }}
        />
      </div>

      {/* Arrow controls (hidden on mobile) */}
      <div className="absolute inset-y-0 left-4 items-center z-20 hidden md:flex">
        <ArrowBox direction="left" contrast="contrast" ariaLabel="Previous slide" onClick={() => emblaApi?.scrollPrev()} />
      </div>
      <div className="absolute inset-y-0 right-4 items-center z-20 hidden md:flex">
        <ArrowBox direction="right" contrast="contrast" ariaLabel="Next slide" onClick={() => emblaApi?.scrollNext()} />
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex flex-col items-center">
          <div className="w-px h-16 bg-[hsl(var(--accent-pink))]"></div>
          <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[hsl(var(--accent-pink))] mt-1"></div>
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
      {/* Book Button */}
      <BookFloatingButton />

      {/* Menu Button */}
      <MenuButton pageType="cafe" menuData={homeMenu} forceCafeAccent />
    </div>
  );
};

export default HeroCarousel;