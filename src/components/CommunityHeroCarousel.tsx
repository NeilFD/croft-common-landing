import { useState, useEffect, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import MenuButton from './MenuButton';
import BookFloatingButton from './BookFloatingButton';
import { communityMenuData } from '@/data/menuData';
import { communityHeroImages as heroImages } from '@/data/heroImages';
import { ArrowBox } from '@/components/ui/ArrowBox';
import OptimizedImage from './OptimizedImage';
import { BRAND_LOGO } from '@/data/brand';

const CommunityHeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFirstReady, setIsFirstReady] = useState(false);

  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      duration: 30
    },
    [autoplay.current]
  );

  // Images from shared data module

  const onSelect = () => {
    if (!emblaApi) return;
    setCurrentSlide(emblaApi.selectedScrollSnap());
  };

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi]);

  useEffect(() => {
    const firstUrl = heroImages[0]?.src;
    let cancelled = false;
    let timeoutId: number | undefined;
    if (autoplay.current && emblaApi) {
      try { autoplay.current.stop(); } catch {}
    }
    const proceed = () => {
      if (cancelled) return;
      setIsFirstReady(true);
      try { autoplay.current?.play?.(); } catch {}
    };
    if (!firstUrl) {
      proceed();
      return;
    }
    const img = new Image();
    img.src = firstUrl;
    // Try to decode ASAP, but also attach onload/onerror for wider support
    // @ts-ignore
    (img as any).decode?.().then(proceed).catch(proceed);
    img.onload = proceed;
    img.onerror = proceed;
    // Safety: start anyway after 4.5s
    // @ts-ignore
    timeoutId = setTimeout(proceed, 4500);
    return () => { cancelled = true; if (timeoutId) clearTimeout(timeoutId); };
  }, [emblaApi]);

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
              alt={`Community hero image ${index + 1}`}
              className="min-h-screen"
              priority={index === 0}
              loading={index === 0 ? 'eager' : 'lazy'}
              sizes="100vw"
              objectPosition={index === 0 ? '50% 80%' : undefined}
            />
          </div>
        ))}
      </div>

      {/* Fixed watermark overlay */}
      <div className="absolute inset-0 flex items-center justify-center mt-16 z-10">
        <img 
          src={BRAND_LOGO}
          alt="Croft Common Watermark"
          className="w-[25rem] h-[25rem] sm:w-[27.5rem] sm:h-[27.5rem] md:w-[30rem] md:h-[30rem] lg:w-[32.5rem] lg:h-[32.5rem] opacity-30 object-contain transition-all duration-500 hover:opacity-70 cursor-pointer"
          style={{ 
            filter: 'invert(1)'
          }}
        />
      </div>

      {/* Page Title Card Overlay */}
      <div className="absolute top-28 left-2 sm:left-4 md:left-[106px] z-20">
        <div className="block mr-auto w-fit max-w-[82vw] sm:max-w-none pl-2 pr-6 sm:px-4 py-3 border-2 border-background bg-transparent rounded-lg transition-all duration-300 hover:border-[hsl(var(--accent-pink))] text-left">
          <h1 className="text-2xl font-light text-background tracking-[0.2em] uppercase transition-colors duration-300 hover:text-[hsl(var(--accent-pink))] cursor-pointer">
            CROFT COMMON COMMUNITY
          </h1>
          <h2 className="text-lg font-light text-background tracking-[0.1em] uppercase mt-1 transition-colors duration-300 hover:text-[hsl(var(--accent-pink))] cursor-pointer">
            COMMON GROUND
          </h2>
        </div>
      </div>

      {/* Arrow controls */}
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
      <BookFloatingButton className="bottom-32 md:bottom-36" />

      {/* Menu Button */}
      <MenuButton pageType="community" menuData={communityMenuData} forceCafeAccent />
    </div>
  );
};

export default CommunityHeroCarousel;