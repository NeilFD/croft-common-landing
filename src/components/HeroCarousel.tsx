import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import MenuButton from './MenuButton';
import OptimizedImage from './OptimizedImage';
import { homeMenu } from '@/data/menuData';
import { homeHeroImages as fallbackHeroImages } from '@/data/heroImages';
import { useCMSImages } from '@/hooks/useCMSImages';
import BookFloatingButton from './BookFloatingButton';
import { ArrowBox } from '@/components/ui/ArrowBox';
import CroftLogo from './CroftLogo';
import { useCarouselAutoplay } from '@/hooks/useCarouselAutoplay';

const HeroCarousel = () => {
  const { autoplay, shouldAutoplay } = useCarouselAutoplay();
  
  // Fetch CMS images with fallback to static images
  const { images: heroImages } = useCMSImages(
    'index', 
    'main_hero', 
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

  // Dev/diagnostics: log resolved hero images and origin once images are available
  useEffect(() => {
    if (!heroImages || heroImages.length === 0) return;
    if (typeof window === 'undefined') return;
    try {
      const resolved = heroImages.map((img, idx) => {
        let origin = 'unknown';
        try { origin = new URL(img.src, window.location.origin).origin; } catch {}
        const sameOrigin = origin === window.location.origin;
        return { index: idx + 1, sameOrigin, origin, src: img.src };
      });
      if (import.meta.env.DEV || window.location.hostname.includes('croftcommontest.com')) {
        console.group('[HeroCarousel] Resolved hero images');
        console.table(resolved);
        console.groupEnd();
      }
    } catch {}
  }, [heroImages]);

  // Pre-decode initial images to remove first-pass jank
  const decodedSetRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!heroImages?.length) return;
    const initialCount = Math.min(heroImages.length, 6);
    const initial = heroImages.slice(0, initialCount);
    initial.forEach((img, i) => {
      if (!decodedSetRef.current.has(img.src)) {
        // Ensure a preload link exists to mark as preloaded for OptimizedImage
        if (typeof document !== 'undefined' && !document.querySelector(`link[rel="preload"][href="${img.src}"]`)) {
          const l = document.createElement('link');
          l.rel = 'preload';
          l.as = 'image';
          l.href = img.src;
          if (i <= 2) l.setAttribute('fetchpriority', 'high');
          document.head.appendChild(l);
        }
        const image = new Image();
        image.src = img.src;
        if ('decode' in image && typeof (image as any).decode === 'function') {
          (image as any).decode().catch(() => {});
        }
        decodedSetRef.current.add(img.src);
      }
    });
    // Idle decode the rest
    const ric: any = (window as any).requestIdleCallback || ((cb: any) => setTimeout(() => cb({ didTimeout: true }), 200));
    const handle = ric(() => {
      heroImages.slice(initialCount).forEach((img) => {
        if (decodedSetRef.current.has(img.src)) return;
        if (typeof document !== 'undefined' && !document.querySelector(`link[rel="preload"][href="${img.src}"]`)) {
          const l = document.createElement('link');
          l.rel = 'preload';
          l.as = 'image';
          l.href = img.src;
          document.head.appendChild(l);
        }
        const i2 = new Image();
        i2.src = img.src;
        if ('decode' in i2 && typeof (i2 as any).decode === 'function') {
          (i2 as any).decode().catch(() => {});
        }
        decodedSetRef.current.add(img.src);
      });
    });
    return () => {
      const cic: any = (window as any).cancelIdleCallback;
      if (cic && handle) cic(handle);
    };
  }, [heroImages]);

  // Decode next slides ahead of time as the user scrolls
  useEffect(() => {
    if (!heroImages?.length) return;
    const total = heroImages.length;
    const next1 = (currentSlide + 1) % total;
    const next2 = (currentSlide + 2) % total;
    [next1, next2].forEach((idx) => {
      const src = heroImages[idx]?.src;
      if (!src || decodedSetRef.current.has(src)) return;
      if (typeof document !== 'undefined' && !document.querySelector(`link[rel="preload"][href="${src}"]`)) {
        const l = document.createElement('link');
        l.rel = 'preload';
        l.as = 'image';
        l.href = src;
        document.head.appendChild(l);
      }
      const i = new Image();
      i.src = src;
      if ('decode' in i && typeof (i as any).decode === 'function') {
        (i as any).decode().catch(() => {});
      }
      decodedSetRef.current.add(src);
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
                alt={`Hero image ${index + 1}`}
                className="min-h-screen"
                priority={isPrioritySlide}
                loading={eager ? 'eager' : 'lazy'}
                sizes="100vw"
                mobileOptimized={true}
                instantTransition={isPrioritySlide || isNext2}
              />
              {/* Subtle overlay for text readability */}
              <div className={`absolute inset-0 ${image.overlay} transition-all duration-1000`}></div>
            </div>
          );
        })}
      </div>

      {/* Fixed watermark overlay */}
      <div className="absolute inset-0 flex items-center justify-center mt-16 z-10 pointer-events-none" aria-hidden data-watermark="true">
        <CroftLogo
          className="w-[27.5rem] h-[27.5rem] sm:w-[30rem] sm:h-[30rem] md:w-[32.5rem] md:h-[32.5rem] lg:w-[35rem] lg:h-[35rem] opacity-30 object-contain transition-all duration-500 hover:opacity-70 invert pointer-events-none"
          priority={true}
          enableDevPanel={false}
          interactive={false}
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