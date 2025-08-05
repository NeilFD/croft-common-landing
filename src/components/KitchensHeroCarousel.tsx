import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

const KitchensHeroCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 60 },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  const [currentSlide, setCurrentSlide] = useState(0);

  const kitchenImages = [
    {
      src: '/lovable-uploads/7a67832c-682c-437c-80c0-30edc2a10f56.png',
      alt: 'Raw steaks hanging'
    },
    {
      src: '/lovable-uploads/8ea5b295-7d10-4aeb-a64c-b646f4046ee2.png',
      alt: 'Pizza oven flames'
    },
    {
      src: '/lovable-uploads/75f518f0-7918-463a-9e00-c016e4271205.png',
      alt: 'Fresh oysters on ice'
    },
    {
      src: '/lovable-uploads/d267ef73-2a5d-4bdd-9f73-63f8c364077f.png',
      alt: 'Table spread of food'
    },
    {
      src: '/lovable-uploads/07cf4977-efa8-49a9-afac-7a2f8f371569.png',
      alt: 'Food hall interior'
    }
  ];

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentSlide(emblaApi.selectedScrollSnap());
  }, [emblaApi, setCurrentSlide]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="relative h-screen overflow-hidden">
      <div className="embla h-full" ref={emblaRef}>
        <div className="embla__container h-full flex">
          {kitchenImages.map((image, index) => (
            <div key={index} className="embla__slide flex-[0_0_100%] relative">
              <div
                className="w-full h-full bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${image.src})` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Watermark - positioned bottom right */}
      <div className="absolute bottom-8 right-8 z-20">
        <img 
          src="/lovable-uploads/886e7962-c1ff-41e4-957d-143eb9c28760.png" 
          alt="Croft Common Watermark" 
          className="h-12 w-auto opacity-70"
        />
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {kitchenImages.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-white' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default KitchensHeroCarousel;