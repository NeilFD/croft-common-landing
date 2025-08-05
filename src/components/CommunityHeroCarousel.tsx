import { useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import MenuButton from './MenuButton';
import { communityMenuData } from '@/data/menuData';

const CommunityHeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      duration: 30
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const heroImages = [
    {
      src: '/lovable-uploads/c22f6cce-8b72-4eb5-96e8-a2fc8adfe7b9.png',
      overlay: 'bg-surface/20'
    },
    {
      src: '/lovable-uploads/dc15ca32-0829-46a6-9db5-897ebaafaff9.png', 
      overlay: 'bg-surface/20'
    },
    {
      src: '/lovable-uploads/a20baf5a-8e8f-41ea-82f5-1801dbd32dd7.png',
      overlay: 'bg-surface/20'
    }
  ];

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
    <section className="relative w-full h-screen overflow-hidden">
      <div className="embla h-full" ref={emblaRef}>
        <div className="embla__container h-full">
          {heroImages.map((image, index) => (
            <div key={index} className="embla__slide relative min-w-0 flex-shrink-0 flex-grow-0 basis-full">
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url('${image.src}')` }}
              />
              <div className={`absolute inset-0 ${image.overlay}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Watermark */}
      <div className="fixed bottom-8 left-8 z-20">
        <img 
          src="/lovable-uploads/fdbc71f5-00d7-4da2-af28-8626b224ec5b.png" 
          alt="Croft Common"
          className="h-12 w-auto opacity-80"
        />
      </div>

      {/* Scroll indicator */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex flex-col items-center text-background/70">
          <div className="w-px h-16 bg-background/30 mb-2"></div>
          <span className="text-xs tracking-widest rotate-90 origin-center whitespace-nowrap">SCROLL</span>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="fixed bottom-8 right-24 z-20 flex space-x-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-background' : 'bg-background/30'
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
          />
        ))}
      </div>

      <MenuButton pageType="community" menuData={communityMenuData} />
    </section>
  );
};

export default CommunityHeroCarousel;