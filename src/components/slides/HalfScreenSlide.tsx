import React, { useEffect, useRef, useState } from 'react';
import OptimizedImage from '@/components/OptimizedImage';
import CroftLogo from '@/components/CroftLogo';
import { ChevronDown } from 'lucide-react';

interface HalfScreenSlideProps {
  title?: string;
  content: string;
  backgroundImage: string;
  imagePosition?: 'left' | 'right';
}

export const HalfScreenSlide: React.FC<HalfScreenSlideProps> = ({
  title,
  content,
  backgroundImage,
  imagePosition = 'left',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  useEffect(() => {
    const checkScrollable = () => {
      if (scrollRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
        const isScrollable = scrollHeight > clientHeight;
        const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 5;
        setShowScrollIndicator(isScrollable && !isScrolledToBottom);
      }
    };

    checkScrollable();
    
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScrollable);
      return () => scrollElement.removeEventListener('scroll', checkScrollable);
    }
  }, [content]);
  return (
    <div className="relative w-full h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Image Side */}
      <div className={`w-full md:w-1/2 h-1/2 md:h-full relative ${imagePosition === 'right' ? 'order-2 md:order-2' : 'order-1 md:order-1'}`}>
        <OptimizedImage
          src={backgroundImage}
          alt="Croft Common"
          className="absolute inset-0 w-full h-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Content Side */}
      <div className={`w-full md:w-1/2 h-1/2 md:h-full bg-black text-white p-4 md:p-6 lg:p-8 flex flex-col justify-center relative ${imagePosition === 'right' ? 'order-1 md:order-1' : 'order-2 md:order-2'}`}>
        <div className="max-w-full">
          {title && (
            <h1 className="font-brutalist text-lg md:text-2xl lg:text-3xl leading-tight mb-3 md:mb-4 lg:mb-6 tracking-tight">
              {title}
            </h1>
          )}
          <div 
            ref={scrollRef}
            className="text-xs md:text-sm leading-relaxed space-y-2 md:space-y-3 lg:space-y-4 max-h-[calc(50vh-4rem)] md:max-h-[calc(100vh-8rem)] overflow-y-auto pr-2"
          >
            {content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-white/90">
                {paragraph}
              </p>
            ))}
          </div>
          
          {/* Scroll Indicator */}
          {showScrollIndicator && (
            <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 z-10">
              <ChevronDown 
                size={16} 
                className="md:w-5 md:h-5 text-[hsl(var(--accent-pink))] opacity-70 animate-bounce" 
              />
            </div>
          )}
        </div>
      </div>

      {/* Croft Logo Watermark */}
      <div className="absolute top-2 right-2 md:top-4 md:right-4 opacity-20 z-10">
        <CroftLogo className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12" />
      </div>
    </div>
  );
};