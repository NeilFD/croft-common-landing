import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import MenuButton from './MenuButton';
import { beerMenu } from '@/data/menuData';


const BeerHeroCarousel = () => {
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
      src: '/lovable-uploads/a6fcbd2e-334d-49e3-9b5d-d7dd0e87d852.png',
      type: 'dark',
      overlay: 'bg-void/20',
      backgroundSize: 'bg-cover'
    },
    {
      src: '/lovable-uploads/3a5090a3-760f-4496-8672-bd8724569325.png',
      type: 'dark',
      overlay: '',
      backgroundSize: 'bg-cover'
    },
    {
      src: '/lovable-uploads/9ef0b073-9f25-420b-8d75-fb90540706d3.png',
      type: 'dark',
      overlay: '',
      backgroundSize: 'bg-cover'
    },
    {
      src: '/lovable-uploads/25105870-85fb-442c-9d85-ee7e218df672.png',
      type: 'warm',
      overlay: '',
      backgroundSize: 'bg-cover'
    },
    {
      src: '/lovable-uploads/1b15e13f-fb17-4f03-a1d9-9a7c2a2611b3.png',
      type: 'dark',
      overlay: 'bg-void/25',
      backgroundSize: 'bg-cover'
    },
    {
      src: '/lovable-uploads/a7f9a44b-d4bc-48db-bf2c-7440227a4b1e.png',
      type: 'warm',
      overlay: '',
      backgroundSize: 'bg-cover'
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
              className={`absolute inset-0 ${image.backgroundSize} bg-center bg-no-repeat transition-all duration-1000`}
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
          src="/lovable-uploads/e1833950-a130-4fb5-9a97-ed21a71fab46.png" 
          alt="Croft Common Watermark"
          className="w-[20rem] h-[20rem] sm:w-[22rem] sm:h-[22rem] md:w-[24rem] md:h-[24rem] lg:w-[26rem] lg:h-[26rem] opacity-30 object-contain transition-all duration-500 hover:opacity-70 cursor-pointer"
          style={{ 
            filter: 'invert(1)'
          }}
        />
      </div>

      {/* Page Title Overlay */}
      <div className="absolute top-24 left-[106px] z-20">
        <h1 className="text-3xl font-light text-background tracking-[0.2em] uppercase transition-all duration-300 hover:text-[hsl(var(--accent-pink))] cursor-pointer">
          BEER
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
      <MenuButton pageType="beer" menuData={beerMenu} forceCafeAccent />
    </div>
  );
};

export default BeerHeroCarousel;