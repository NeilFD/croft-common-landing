import { useCallback, useEffect, useState, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

const KitchensHeroCarousel = () => {
  const autoplayRef = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      duration: 30 // Smooth transitions
    },
    [autoplayRef.current]
  );

  const [currentSlide, setCurrentSlide] = useState(0);

  const kitchenImages = [
    {
      src: '/lovable-uploads/7a67832c-682c-437c-80c0-30edc2a10f56.png',
      type: 'dark',
      overlay: 'bg-void/30'
    },
    {
      src: '/lovable-uploads/8ea5b295-7d10-4aeb-a64c-b646f4046ee2.png',
      type: 'warm',
      overlay: 'bg-void/20'
    },
    {
      src: '/lovable-uploads/75f518f0-7918-463a-9e00-c016e4271205.png',
      type: 'mixed',
      overlay: 'bg-void/25'
    },
    {
      src: '/lovable-uploads/d267ef73-2a5d-4bdd-9f73-63f8c364077f.png',
      type: 'dark',
      overlay: 'bg-void/30'
    },
    {
      src: '/lovable-uploads/07cf4977-efa8-49a9-afac-7a2f8f371569.png',
      type: 'industrial',
      overlay: 'bg-void/35'
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
      {/* KITCHENS title positioned under header */}
      <div className="absolute top-32 left-[6.75rem] z-20">
        <h1 className="font-brutalist text-6xl text-background tracking-wider">
          KITCHENS
        </h1>
      </div>
      <div className="flex">
        {kitchenImages.map((image, index) => (
          <div 
            key={index}
            className="flex-[0_0_100%] relative min-h-screen"
          >
            {/* Background Image with type-specific styling */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
              style={{
                backgroundImage: `url('${image.src}')`
              }}
            >
              {/* Subtle overlay for text readability */}
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
        {kitchenImages.map((_, index) => (
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

export default KitchensHeroCarousel;