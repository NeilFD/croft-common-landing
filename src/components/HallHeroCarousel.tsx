import { useCallback, useEffect, useState, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

const HallHeroCarousel = () => {
  const autoplayRef = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      duration: 30
    },
    [autoplayRef.current]
  );

  const [currentSlide, setCurrentSlide] = useState(0);

  const heroImages = [
    {
      src: '/lovable-uploads/8e6a7ddc-9c1d-4779-bd58-8c4ef5fd6646.png',
      type: 'dark',
      overlay: 'bg-void/30'
    },
    {
      src: '/lovable-uploads/b64216a3-dd09-4428-a328-02343a5f2a23.png',
      type: 'dark',
      overlay: 'bg-void/25'
    },
    {
      src: '/lovable-uploads/fdbc71f5-00d7-4da2-af28-8626b224ec5b.png',
      type: 'light',
      overlay: 'bg-void/15'
    },
    {
      src: '/lovable-uploads/5d770f71-d0ac-45ef-b72f-b853c4020425.png',
      type: 'mixed',
      overlay: 'bg-void/25'
    }
  ];

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentSlide(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative min-h-screen overflow-hidden" ref={emblaRef}>
      {/* HALL title positioned under header */}
      <div className="absolute top-32 left-[6.75rem] z-20">
        <h1 className="font-brutalist text-6xl text-background tracking-wider">
          HALL
        </h1>
      </div>
      <div className="flex">
        {heroImages.map((image, index) => (
          <div 
            key={index}
            className="flex-[0_0_100%] relative min-h-screen"
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
              style={{
                backgroundImage: `url('${image.src}')`
              }}
            >
              {/* Overlay for text readability */}
              <div className={`absolute inset-0 ${image.overlay} transition-all duration-1000`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Fixed watermark overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-16 z-10">
        <img 
          src="/lovable-uploads/a2ee3fd5-4eb3-4a7e-8433-c4bb065295f4.png" 
          alt="Croft Common Watermark" 
          className="w-[40rem] h-[40rem] opacity-60 object-contain transition-all duration-1000"
          style={{ 
            filter: 'brightness(0) invert(1) contrast(100)'
          }}
        />
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="w-px h-16 bg-background/50"></div>
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

export default HallHeroCarousel;