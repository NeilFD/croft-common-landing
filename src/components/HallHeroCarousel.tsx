import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { hallHeroImages as fallbackHeroImages } from '@/data/heroImages';
import { useCMSImages } from '@/hooks/useCMSImages';
import OptimizedImage from './OptimizedImage';
import { ArrowBox } from '@/components/ui/ArrowBox';
import BookFloatingButton from '@/components/BookFloatingButton';
import MenuButton from '@/components/MenuButton';
import { EnquiryFloatingButton } from '@/components/EnquiryFloatingButton';
import { CMSText } from '@/components/cms/CMSText';
import CroftLogo from './CroftLogo';
import { hallMenuData } from '@/data/menuData';
import { useCMSMode } from '@/contexts/CMSModeContext';
import { useCarouselAutoplay } from '@/hooks/useCarouselAutoplay';

const HallHeroCarousel = () => {
  const { isCMSMode } = useCMSMode();
  const { autoplay, shouldAutoplay } = useCarouselAutoplay();
  const { images: heroImages } = useCMSImages(
    'hall', 
    'hall_hero', 
    { fallbackImages: fallbackHeroImages }
  );
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: shouldAutoplay,
      duration: 30
    },
    autoplay.current ? [autoplay.current] : []
  );

  const [currentSlide, setCurrentSlide] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentSlide(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

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
                alt={`Hall hero image ${index + 1}`}
                className="min-h-screen"
                priority={isPrioritySlide}
                loading={eager ? 'eager' : 'lazy'}
                sizes="100vw"
                instantTransition={isPrioritySlide || isNext2}
              />
              {/* Overlay for text readability */}
              <div className={`absolute inset-0 ${image.overlay} transition-all duration-1000`}></div>
            </div>
          );
        })}
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
        <CMSText 
          page="hall" 
          section="hero" 
          contentKey="overlay-title" 
          fallback="HALL"
          as="h1"
          className="inline-block px-3 py-1 border-2 border-background text-background bg-transparent rounded-lg text-3xl font-light tracking-[0.2em] uppercase transition-all duration-300 hover:border-[hsl(var(--accent-pink))] hover:text-[hsl(var(--accent-pink))]"
        />
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

      {/* Book button */}
      {!isCMSMode && <EnquiryFloatingButton />}
      {!isCMSMode && <BookFloatingButton className="bottom-36" />}
      
      {/* Menu button */}
      {!isCMSMode && <MenuButton pageType="hall" menuData={hallMenuData} />}
    </div>
  );
};

export default HallHeroCarousel;