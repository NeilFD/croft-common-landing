import { useState, useEffect } from 'react';
import { useWatermarkColor } from '@/hooks/useWatermarkColor';

const KitchensHeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const watermarkColor = useWatermarkColor();

  const slides = [
    {
      image: '/lovable-uploads/2e96bab2-78ad-4aca-b91c-9153b04062ec.png',
      title: 'CRAFT',
      subtitle: 'Premium cuts, aged to perfection'
    },
    {
      image: '/lovable-uploads/30928fed-ad4d-4c98-8f54-4e2f912ead14.png',
      title: 'FIRE',
      subtitle: 'Wood-fired traditions'
    },
    {
      image: '/lovable-uploads/fcab0dc6-fb15-4cd8-9883-eaf42bcfb28b.png',
      title: 'FEAST',
      subtitle: 'Shared moments, shared flavors'
    },
    {
      image: '/lovable-uploads/a2f84890-c19d-496d-8609-db291a971fb1.png',
      title: 'FRESH',
      subtitle: 'Ocean to plate'
    },
    {
      image: '/lovable-uploads/d0be2079-21a5-4df6-860a-90923019416a.png',
      title: 'MARKET',
      subtitle: 'Four vendors, endless possibilities'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative h-screen overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div 
            className="w-full h-full bg-cover bg-center relative"
            style={{ 
              backgroundImage: `url(${slide.image})`,
            }}
          >
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40" />
            
            {/* Text overlay */}
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center z-10">
              <h1 className="font-brutalist text-6xl md:text-8xl lg:text-9xl text-white mb-4 tracking-tight">
                {slide.title}
              </h1>
              <p className="font-industrial text-lg md:text-xl text-white/90 max-w-2xl px-6 leading-relaxed">
                {slide.subtitle}
              </p>
            </div>
          </div>
        </div>
      ))}
      
      {/* Watermark */}
      <div className="absolute bottom-8 right-8 z-20 pointer-events-none">
        <img 
          src="/lovable-uploads/a2ee3fd5-4eb3-4a7e-8433-c4bb065295f4.png" 
          alt="Croft Common" 
          className="w-20 h-20 object-contain opacity-80"
          style={{ 
            filter: `brightness(0) invert(1) contrast(200) drop-shadow(0 0 10px ${watermarkColor})`
          }}
        />
      </div>
      
      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-110' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default KitchensHeroCarousel;