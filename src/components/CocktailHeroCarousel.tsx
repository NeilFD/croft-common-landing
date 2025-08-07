import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import MenuButton from './MenuButton';
import { cocktailMenu } from '@/data/menuData';

const CocktailHeroCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      duration: 30 // Smooth transitions
    },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  const [currentSlide, setCurrentSlide] = useState(0);

  const heroImages = [
    {
      src: '/lovable-uploads/8dc68acd-38ac-4910-a909-716d78b1d187.png',
      type: 'warm',
      overlay: 'bg-void/30'
    },
    {
      src: '/lovable-uploads/19074a8e-e1ee-4793-8c75-c60bd7818a99.png',
      type: 'dark',
      overlay: ''
    },
    {
      src: '/lovable-uploads/ada4b655-67e6-4bbe-8e52-ea2d407da312.png',
      type: 'warm',
      overlay: 'bg-void/25'
    },
    {
      src: '/lovable-uploads/0c4a9d3f-d5a3-4a01-85fb-ed3f272a821f.png',
      type: 'dark',
      overlay: ''
    },
    {
      src: '/lovable-uploads/644b4e2a-eb1b-4d76-a734-f012e7d69379.png',
      type: 'dark',
      overlay: ''
    },
    {
      src: '/lovable-uploads/4a785c1a-4ea4-4874-b47e-24c5c2611368.png',
      type: 'dark',
      overlay: ''
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

  const currentImage = heroImages[currentSlide];

  return (
    <div className="relative min-h-screen overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {heroImages.map((image, index) => (
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
      <div className="absolute inset-0 flex items-center justify-center mt-16 z-10">
        <img 
          src="/src/assets/croft-logo.png" 
          alt="Croft Common Watermark" 
          className="w-[40rem] h-[40rem] opacity-60 object-contain transition-all duration-500 hover:opacity-80 cursor-pointer"
          style={{ 
            filter: 'invert(1)'
          }}
        />
      </div>

      {/* Page Title Overlay */}
      <div className="absolute top-24 left-[106px] z-20">
        <h1 className="text-3xl font-light text-background tracking-[0.2em] uppercase transition-all duration-300 hover:text-[hsl(var(--accent-lime))] cursor-pointer">
          COCKTAILS
        </h1>
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

      {/* Menu Button */}
      <MenuButton pageType="cocktails" menuData={cocktailMenu} />
    </div>
  );
};

export default CocktailHeroCarousel;