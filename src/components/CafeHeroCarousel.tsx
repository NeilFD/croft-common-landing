import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import MenuButton from './MenuButton';
import { cafeMenu } from '@/data/menuData';


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
      src: '/lovable-uploads/0a0894f9-a169-4747-9282-2150f198561c.png',
      type: 'dark',
      overlay: 'bg-void/35',
      backgroundPosition: '50% 45%'
    },
    {
      src: '/lovable-uploads/544efa64-6a2b-4db8-ba10-4da2954a97da.png',
      type: 'warm',
      overlay: '',
      backgroundPosition: 'center center'
    },
    {
      src: '/lovable-uploads/e6f7674f-71d0-4ec4-8782-a283ed5ba5b5.png',
      type: 'dark',
      overlay: 'bg-void/25',
      backgroundPosition: '55% center'
    },
    {
      src: '/lovable-uploads/9110aec8-9e43-43ad-b701-6d4948d1f48b.png',
      type: 'warm',
      overlay: '',
      backgroundPosition: 'center center'
    },
    {
      src: '/lovable-uploads/0726808b-f108-44ac-bc6c-12c7eead462a.png',
      type: 'dark',
      overlay: 'bg-void/30',
      backgroundPosition: 'center 60%'
    },
    {
      src: '/lovable-uploads/e5c78d77-a685-4c5c-ab4a-2968bde2a0de.png',
      type: 'warm',
      overlay: 'bg-void/20',
      backgroundPosition: '65% center'
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
      <div className="flex">
        {cafeImages.map((image, index) => (
          <div 
            key={index}
            className="flex-[0_0_100%] relative min-h-screen"
          >
            {/* Background Image with type-specific styling and error handling */}
            <div 
              className="absolute inset-0 bg-cover bg-no-repeat transition-all duration-1000"
              style={{
                backgroundImage: `url('${image.src}')`,
                backgroundPosition: image.backgroundPosition
              }}
              onError={(e) => {
                console.error(`Failed to load image: ${image.src}`);
                // Fallback to a solid color if image fails
                (e.target as HTMLDivElement).style.backgroundColor = 'hsl(var(--steel))';
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
          src="/lovable-uploads/e1833950-a130-4fb5-9a97-ed21a71fab46.png" 
          alt="Croft Common Watermark"
          className="w-[40rem] h-[40rem] opacity-30 object-contain transition-all duration-500 hover:opacity-50 cursor-pointer"
          style={{ 
            filter: 'invert(1)'
          }}
        />
      </div>

      {/* Page Title Overlay */}
      <div className="absolute top-24 left-[106px] z-20">
        <h1 className="text-3xl font-light text-background tracking-[0.2em] uppercase transition-all duration-300 hover:text-[hsl(var(--accent-pink))] cursor-pointer">
          CAFE
        </h1>
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

      {/* Menu Button */}
      <MenuButton pageType="cafe" menuData={cafeMenu} />
    </div>
  );
};

export default CafeHeroCarousel;