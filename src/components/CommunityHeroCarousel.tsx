import { useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import MenuButton from './MenuButton';
import BookFloatingButton from './BookFloatingButton';
import { communityMenuData } from '@/data/menuData';
import { communityHeroImages as heroImages } from '@/data/heroImages';


const CommunityHeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      duration: 30
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  // Images from shared data module

  const onSelect = () => {
    if (!emblaApi) return;
    setCurrentSlide(emblaApi.selectedScrollSnap());
  };

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi]);

  return (
    <div className="relative min-h-screen overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {heroImages.map((image, index) => (
          <div 
            key={index}
            className="flex-[0_0_100%] relative min-h-screen"
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-no-repeat transition-all duration-1000"
              style={{
                backgroundImage: `url('${image.src}')`,
                backgroundPosition: '50% 80%'
              }}
            />
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

      {/* Page Title Card Overlay */}
      <div className="absolute top-28 left-4 md:left-[106px] z-20">
        <div className="inline-block px-4 py-3 border-2 border-background bg-transparent rounded-lg transition-all duration-300 hover:border-[hsl(var(--accent-pink))]">
          <h1 className="text-2xl font-light text-background tracking-[0.2em] uppercase transition-colors duration-300 hover:text-[hsl(var(--accent-pink))] cursor-pointer">
            CROFT COMMON COMMUNITY
          </h1>
          <h2 className="text-lg font-light text-background tracking-[0.1em] uppercase mt-1 transition-colors duration-300 hover:text-[hsl(var(--accent-pink))] cursor-pointer">
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
      <BookFloatingButton />

      {/* Menu Button */}
      <MenuButton pageType="community" menuData={communityMenuData} forceCafeAccent />
    </div>
  );
};

export default CommunityHeroCarousel;