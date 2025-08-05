import { useState, useEffect } from 'react';
import { useWatermarkColor } from '@/hooks/useWatermarkColor';
import CroftLogo from './CroftLogo';

const KitchensHeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const watermarkColor = useWatermarkColor();

  const slides = [
    {
      image: '/lovable-uploads/19ce1d72-3c1c-4ce3-b2be-b036541b4fd6.png',
      title: 'KITCHENS',
      subtitle: 'Four vendors. One pass. Food when ready. Simple plates.',
      description: 'Just noise, heat, and shared tables.'
    },
    {
      image: '/lovable-uploads/1fa27404-8a67-48c0-90dc-188a4995a64f.png',
      title: 'KITCHENS',
      subtitle: 'Four vendors. One pass. Food when ready. Simple plates.',
      description: 'Just noise, heat, and shared tables.'
    },
    {
      image: '/lovable-uploads/be524bf0-fe0d-493d-971c-8f491315e136.png',
      title: 'KITCHENS',
      subtitle: 'Four vendors. One pass. Food when ready. Simple plates.',
      description: 'Just noise, heat, and shared tables.'
    },
    {
      image: '/lovable-uploads/e7660c93-fd40-4b00-aaa8-140c18355a71.png',
      title: 'KITCHENS',
      subtitle: 'Four vendors. One pass. Food when ready. Simple plates.',
      description: 'Just noise, heat, and shared tables.'
    },
    {
      image: '/lovable-uploads/34aed79a-4198-4016-97a3-a38b8c1d2b81.png',
      title: 'KITCHENS',
      subtitle: 'Four vendors. One pass. Food when ready. Simple plates.',
      description: 'Just noise, heat, and shared tables.'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section data-section="hero" className="relative h-screen overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${slide.image})`,
            }}
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="text-center text-white px-6">
          <h1 className="font-brutalist text-6xl md:text-8xl lg:text-9xl mb-6 tracking-wider">
            {slides[currentSlide].title}
          </h1>
          <p className="font-industrial text-xl md:text-2xl mb-4 max-w-3xl mx-auto leading-relaxed">
            {slides[currentSlide].subtitle}
          </p>
          <p className="font-industrial text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            {slides[currentSlide].description}
          </p>
        </div>
      </div>

      {/* Watermark */}
      <div 
        className="fixed bottom-8 right-8 z-50 pointer-events-none"
        data-watermark="true"
        style={{
          color: `rgb(${watermarkColor})`,
        }}
      >
        <CroftLogo />
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default KitchensHeroCarousel;