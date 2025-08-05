import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

const CafeHeroCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      duration: 30 // Smooth transitions
    },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  const [currentSlide, setCurrentSlide] = useState(0);

  const cafeImages = [
    {
      src: '/lovable-uploads/3f7371f7-30d1-4118-b421-5a4937be9a2d.png',
      type: 'dark',
      overlay: 'bg-void/30',
      backgroundPosition: 'bg-center'
    },
    {
      src: '/lovable-uploads/e6f7674f-71d0-4ec4-8782-a283ed5ba5b5.png',
      type: 'dark',
      overlay: 'bg-void/25',
      backgroundPosition: 'bg-[center_-200px]' // Move image up to center coffee cup behind watermark
    },
    {
      src: '/lovable-uploads/0726808b-f108-44ac-bc6c-12c7eead462a.png',
      type: 'dark',
      overlay: 'bg-void/30',
      backgroundPosition: 'bg-center'
    },
    {
      src: '/lovable-uploads/e5c78d77-a685-4c5c-ab4a-2968bde2a0de.png',
      type: 'warm',
      overlay: 'bg-void/20',
      backgroundPosition: 'bg-center'
    },
    {
      src: '/lovable-uploads/0a0894f9-a169-4747-9282-2150f198561c.png',
      type: 'dark',
      overlay: 'bg-void/35',
      backgroundPosition: 'bg-center'
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
      {/* CAFÉ title positioned under header */}
      <div className="absolute top-32 left-[6.75rem] z-20">
        <h1 className="font-brutalist text-6xl text-background tracking-wider">
          CAFÉ
        </h1>
      </div>
      <div className="flex">
        {cafeImages.map((image, index) => (
          <div 
            key={index}
            className="flex-[0_0_100%] relative min-h-screen"
          >
            {/* Background Image with type-specific styling */}
            <div 
              className={`absolute inset-0 bg-cover ${image.backgroundPosition} bg-no-repeat transition-all duration-1000`}
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
        {cafeImages.map((_, index) => (
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

export default CafeHeroCarousel;