import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import MenuButton from './MenuButton';
import OptimizedImage from './OptimizedImage';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { homeMenu } from '@/data/menuData';


const HeroCarousel = () => {
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
      src: '/lovable-uploads/554a5ea5-4c34-4b71-971b-a896a47f8927.png',
      type: 'dark',
      overlay: 'bg-void/30'
    },
    {
      src: '/lovable-uploads/2cf25417-28ae-479d-b6b8-19e126392333.png',
      type: 'warm',
      overlay: 'bg-void/20'
    },
    {
      src: '/lovable-uploads/64b7fab3-00a9-4045-9318-590eb75f1336.png',
      type: 'warm',
      overlay: 'bg-void/30'
    },
    {
      src: '/lovable-uploads/5d1d2f5e-37ba-44a7-a95f-ec6970e2eaaf.png',
      type: 'mixed',
      overlay: 'bg-void/25'
    }
  ];

  const imageUrls = heroImages.map(img => img.src);
  const { loading: imagesLoading } = useImagePreloader(imageUrls, { enabled: true, priority: true });

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
            {/* Optimized Background Image */}
            <OptimizedImage
              src={image.src}
              alt={`Hero image ${index + 1}`}
              className="min-h-screen"
              priority={index === 0}
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            {/* Subtle overlay for text readability */}
            <div className={`absolute inset-0 ${image.overlay} transition-all duration-1000`}></div>
          </div>
        ))}
      </div>

      {/* Fixed watermark overlay */}
      <div className="absolute inset-0 flex items-center justify-center mt-16 z-10">
        <img 
          src="/lovable-uploads/e1833950-a130-4fb5-9a97-ed21a71fab46.png" 
          alt="Croft Common Watermark"
          className="w-[18rem] h-[18rem] sm:w-[20rem] sm:h-[20rem] md:w-[22rem] md:h-[22rem] lg:w-[24rem] lg:h-[24rem] opacity-30 object-contain transition-all duration-500 hover:opacity-50 cursor-pointer"
          style={{ 
            filter: 'invert(1)'
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

      {/* Menu Button */}
      <MenuButton pageType="cafe" menuData={homeMenu} />
    </div>
  );
};

export default HeroCarousel;