import { useState, useEffect, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import MenuButton from './MenuButton';
import BookFloatingButton from './BookFloatingButton';

import { communityMenuData } from '@/data/menuData';
import { communityHeroImages as fallbackHeroImages } from '@/data/heroImages';
import { useCMSImages } from '@/hooks/useCMSImages';
import OptimizedImage from './OptimizedImage';
import { ArrowBox } from '@/components/ui/ArrowBox';
import CroftLogo from './CroftLogo';
import { useCarouselAutoplay } from '@/hooks/useCarouselAutoplay';

const CommunityHeroCarousel = () => {
  const { autoplay, shouldAutoplay } = useCarouselAutoplay(5000);
  const { images: heroImages } = useCMSImages(
    'community', 
    'community_hero', 
    { fallbackImages: fallbackHeroImages }
  );
  
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: shouldAutoplay,
      duration: 30
    },
    autoplay.current ? [autoplay.current] : []
  );

  const onSelect = () => {
    if (!emblaApi) return;
    setCurrentSlide(emblaApi.selectedScrollSnap());
  };

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi]);

  // Decode-ahead: pre-decode first 6, idle-decode rest, and decode next slides
  const decodedSetRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!heroImages?.length) return;
    const initialCount = Math.min(heroImages.length, 6);
    const initial = heroImages.slice(0, initialCount);
    initial.forEach((img, i) => {
      if (!decodedSetRef.current.has(img.src)) {
        if (typeof document !== 'undefined' && !document.querySelector(`link[rel=\"preload\"][href=\"${img.src}\"]`)) {
          const l = document.createElement('link');
          l.rel = 'preload'; l.as = 'image'; l.href = img.src; if (i <= 2) l.setAttribute('fetchpriority','high'); document.head.appendChild(l);
        }
        const im = new Image(); im.src = img.src; if ('decode' in im && typeof (im as any).decode === 'function') {(im as any).decode().catch(() => {});} decodedSetRef.current.add(img.src);
      }
    });
    const ric: any = (window as any).requestIdleCallback || ((cb: any) => setTimeout(() => cb({ didTimeout: true }), 200));
    const handle = ric(() => {
      heroImages.slice(initialCount).forEach((img) => {
        if (decodedSetRef.current.has(img.src)) return;
        if (typeof document !== 'undefined' && !document.querySelector(`link[rel=\"preload\"][href=\"${img.src}\"]`)) {
          const l = document.createElement('link'); l.rel = 'preload'; l.as = 'image'; l.href = img.src; document.head.appendChild(l);
        }
        const i2 = new Image(); i2.src = img.src; if ('decode' in i2 && typeof (i2 as any).decode === 'function') {(i2 as any).decode().catch(() => {});} decodedSetRef.current.add(img.src);
      });
    });
    return () => { const cic: any = (window as any).cancelIdleCallback; if (cic && handle) cic(handle); };
  }, [heroImages]);

  useEffect(() => {
    if (!heroImages?.length) return;
    const total = heroImages.length; const next1 = (currentSlide + 1) % total; const next2 = (currentSlide + 2) % total;
    [next1, next2].forEach((idx) => {
      const src = heroImages[idx]?.src; if (!src || decodedSetRef.current.has(src)) return;
      if (typeof document !== 'undefined' && !document.querySelector(`link[rel=\"preload\"][href=\"${src}\"]`)) { const l = document.createElement('link'); l.rel = 'preload'; l.as = 'image'; l.href = src; document.head.appendChild(l); }
      const i = new Image(); i.src = src; if ('decode' in i && typeof (i as any).decode === 'function') {(i as any).decode().catch(() => {});} decodedSetRef.current.add(src);
    });
  }, [currentSlide, heroImages]);

  return (
    <div className="embla-carousel relative min-h-screen overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {heroImages.map((image, index) => {
          const total = heroImages.length || 1;
          const isCurrent = index === currentSlide;
          const isNext1 = index === ((currentSlide + 1) % total);
          const isNext2 = index === ((currentSlide + 2) % total);
          const isPrioritySlide = isCurrent || isNext1;
          const eager = isPrioritySlide || isNext2 || index <= 5;
          return (
            <div 
              key={index}
              className="flex-[0_0_100%] relative min-h-screen"
            >
              {/* Optimized Background Image */}
              <OptimizedImage
                src={image.src}
                alt={`Community hero image ${index + 1}`}
                className="min-h-screen"
                priority={isPrioritySlide}
                loading={eager ? 'eager' : 'lazy'}
                sizes="100vw"
                objectPosition={index === 0 ? '50% 80%' : undefined}
                instantTransition={isPrioritySlide || isNext2}
              />
            </div>
          );
        })}
      </div>

      {/* Fixed watermark overlay */}
      <div className="absolute inset-0 flex items-center justify-center mt-16 z-10 pointer-events-none" aria-hidden data-watermark="true">
        <CroftLogo
          className="w-[25rem] h-[25rem] sm:w-[27.5rem] sm:h-[27.5rem] md:w-[30rem] md:h-[30rem] lg:w-[32.5rem] lg:h-[32.5rem] opacity-30 object-contain transition-all duration-500 hover:opacity-70 invert pointer-events-none"
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

      {/* Page Title Card Overlay */}
      <div className="absolute left-2 sm:left-4 md:left-[106px] z-20" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 140px)' }}>
        <div className="block mr-auto w-fit max-w-[82vw] sm:max-w-none pl-2 pr-6 sm:px-4 py-3 border-2 border-background bg-transparent rounded-lg transition-all duration-300 hover:border-[hsl(var(--accent-pink))] text-left">
          <h1 className="text-2xl font-light text-background tracking-[0.2em] uppercase transition-colors duration-300 hover:text-[hsl(var(--accent-pink))]">
            CROFT COMMON COMMUNITY
          </h1>
          <h2 className="text-lg font-light text-background tracking-[0.1em] uppercase mt-1 transition-colors duration-300 hover:text-[hsl(var(--accent-pink))]">
            COMMON GROUND
          </h2>
        </div>
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