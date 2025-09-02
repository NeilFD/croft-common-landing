import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import CroftLogo from '@/components/CroftLogo';

interface TaproomSlideProps {
  title: string;
  leftContent: string;
  rightImage: string;
}

export const TaproomSlide: React.FC<TaproomSlideProps> = ({
  title,
  leftContent,
  rightImage,
}) => {
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.scroll-container');
      if (scrollContainer) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const isScrollable = scrollHeight > clientHeight;
        const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
        setShowScrollIndicator(isScrollable && !isAtBottom);
      }
    };

    const scrollContainer = document.querySelector('.scroll-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      // Check initial state after a brief delay to ensure content is rendered
      const timer = setTimeout(handleScroll, 100);
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
        clearTimeout(timer);
      };
    }
  }, []);

  const formatContent = (content: string) => {
    return content.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-4 md:mb-6 last:mb-0">
        {paragraph}
      </p>
    ));
  };

  return (
    <div className="relative w-full h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left Side - Pink Background with Scrollable Text */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full bg-[hsl(var(--accent-pink))] text-white pt-48 pb-24 md:p-8 lg:p-12 px-4 md:px-8 lg:px-12 flex flex-col relative">
        <div className="scroll-container flex-1 overflow-y-auto pr-2 md:pr-4 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
          <div className="text-xs md:text-sm lg:text-base leading-relaxed">
            {formatContent(leftContent)}
          </div>
        </div>
        
        {/* Scroll Indicator */}
        {showScrollIndicator && (
          <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-4 w-4 md:h-6 md:w-6 text-white" />
          </div>
        )}
      </div>

      {/* Right Side - Image with Overlaid Title */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative">
        <img 
          src={rightImage} 
          alt="Taproom interior" 
          className="w-full h-full object-cover"
        />
        {/* Title Overlay */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <h1 className="font-brutalist text-2xl md:text-4xl lg:text-6xl text-white text-center leading-tight tracking-tight px-4 md:px-8 max-w-2xl">
            {title}
          </h1>
        </div>
      </div>

      {/* Croft Logo Watermark */}
      <div className="absolute top-2 right-2 md:top-4 md:right-4 opacity-20 z-10">
        <CroftLogo className="h-8 w-8 md:h-12 md:w-12" />
      </div>
    </div>
  );
};