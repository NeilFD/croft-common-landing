import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import MenuButton from './MenuButton';
import BookFloatingButton from './BookFloatingButton';

import OptimizedImage from './OptimizedImage';
import { ArrowBox } from '@/components/ui/ArrowBox';
import { beerMenu } from '@/data/menuData';
import { beerHeroImages as fallbackHeroImages } from '@/data/heroImages';
import { useCMSImages } from '@/hooks/useCMSImages';
import { useCMSMenuData } from '@/hooks/useCMSMenuData';
import { useNativePlatform } from '@/hooks/useNativePlatform';
import CroftLogo from './CroftLogo';

const BeerHeroCarousel = () => {
  const { isIOS } = useNativePlatform();
  const { images: heroImages, loading: imagesLoading } = useCMSImages(
    'beer', 
    'beer_hero', 
    { fallbackImages: fallbackHeroImages }
  );
  
  const { data: cmsMenuData, loading: menuLoading } = useCMSMenuData('beer', false);
  
  const shouldAutoplay = !isIOS;
  const autoplay = useRef(shouldAutoplay ? Autoplay({ delay: 4000, stopOnInteraction: false }) : null);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: !isIOS,
      duration: 30
    },
    autoplay.current ? [autoplay.current] : []
  );

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFirstReady, setIsFirstReady] = useState(false);

  // Images supplied by shared data module

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
    if (!shouldAutoplay) {
      setIsFirstReady(true);
      return;
    }
    
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
    // @ts-ignore
    (img as any).decode?.().then(proceed).catch(proceed);
    img.onload = proceed;
    img.onerror = proceed;
    // @ts-ignore
    timeoutId = setTimeout(proceed, 4500);
    return () => { cancelled = true; if (timeoutId) clearTimeout(timeoutId); };
  }, [emblaApi, shouldAutoplay]);

  const currentImage = heroImages[currentSlide];

  return (
    <div className="embla-carousel relative min-h-screen overflow-hidden z-0" ref={emblaRef}>
      <div className="flex">
        {heroImages.map((image, index) => (
          <div 
            key={index}
            className="flex-[0_0_100%] relative min-h-screen"
          >
            {/* Optimized Background Image */}
            <OptimizedImage
              src={image.src}
              alt={`Beer hero image ${index + 1}`}
              className="min-h-screen"
              priority={index === 0}
              loading={index === 0 ? 'eager' : 'lazy'}
              sizes="100vw"
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

      {/* Navigation arrows for larger screens */}
      <div className="hidden md:block">
        <ArrowBox 
          direction="left" 
          onClick={() => emblaApi?.scrollPrev()} 
          className="absolute left-8 top-1/2 -translate-y-1/2 z-20"
        />
        <ArrowBox 
          direction="right" 
          onClick={() => emblaApi?.scrollNext()} 
          className="absolute right-8 top-1/2 -translate-y-1/2 z-20"
        />
      </div>

      {/* Page Title Overlay */}
      <div className="absolute left-4 md:left-[106px] z-20" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 140px)' }}>
        <h1 className="inline-block px-3 py-1 border-2 border-background text-background bg-transparent rounded-lg text-3xl font-light tracking-[0.2em] uppercase transition-all duration-300 hover:border-[hsl(var(--accent-pink))] hover:text-[hsl(var(--accent-pink))]">
          BEER
        </h1>
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
      <MenuButton pageType="beer" menuData={cmsMenuData.length > 0 ? cmsMenuData : beerMenu} forceCafeAccent />
    </div>
  );
};

export default BeerHeroCarousel;