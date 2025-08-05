import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback, useEffect, useState } from 'react';

const CocktailHeroCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      duration: 40
    },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  const [currentSlide, setCurrentSlide] = useState(0);

  const heroImages = [
    {
      src: '/lovable-uploads/afb10854-3a0d-45c1-acb6-7f3861ba8e44.png',
      type: 'image',
      overlay: 'CRAFT COCKTAILS'
    },
    {
      src: '/lovable-uploads/60514e1b-a34b-4e52-9a94-e05b34e57cd6.png',
      type: 'image',
      overlay: 'CLASSIC ELEGANCE'
    },
    {
      src: '/lovable-uploads/bdfbc015-0bea-46a0-9567-fc7b8e155884.png',
      type: 'image',
      overlay: 'ARTISANAL SPIRITS'
    },
    {
      src: '/lovable-uploads/ccf05281-c605-448e-ab8a-fbcd7cbaae4f.png',
      type: 'image',
      overlay: 'EVENING ATMOSPHERE'
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
    <section className="relative h-screen overflow-hidden">
      <div className="embla h-full" ref={emblaRef}>
        <div className="embla__container h-full">
          {heroImages.map((image, index) => (
            <div key={index} className="embla__slide relative h-full flex-[0_0_100%]">
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${image.src})` }}
              />
              
              {/* Dark overlay for better text readability */}
              <div className="absolute inset-0 bg-black/40" />
              
              {/* Content overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center z-10">
                  <h1 className="font-brutalist text-4xl md:text-7xl lg:text-8xl text-white mb-6 tracking-tight">
                    {image.overlay}
                  </h1>
                  <p className="font-industrial text-lg md:text-xl text-white/90 max-w-2xl mx-auto px-6 leading-relaxed">
                    Evening transforms our space into a cocktail destination. Classic techniques meet creative flair, 
                    crafting drinks that capture the spirit of Bristol's most dynamic neighborhood.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed watermark logo */}
      <div className="fixed bottom-8 right-8 z-20 pointer-events-none">
        <img 
          src="/lovable-uploads/a2ee3fd5-4eb3-4a7e-8433-c4bb065295f4.png" 
          alt="Croft Common" 
          className="w-16 h-16 opacity-60"
        />
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {heroImages.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-[hsl(var(--accent-lime))] w-8' 
                : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default CocktailHeroCarousel;