import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import CroftLogo from '@/components/CroftLogo';
import OptimizedImage from '@/components/OptimizedImage';

interface ImageTextSlideProps {
  title: string;
  rightTitle: string;
  leftContent: string;
  rightImage: string;
}

export const ImageTextSlide: React.FC<ImageTextSlideProps> = ({
  title,
  rightTitle,
  leftContent,
  rightImage,
}) => {
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  useEffect(() => {
    const checkScrollState = (scrollContainer: HTMLElement) => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isScrollable = scrollHeight > clientHeight;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5; // Reduced threshold for better detection
      setShowScrollIndicator(isScrollable && !isAtBottom);
    };

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      checkScrollState(target);
    };

    // Use a timeout to ensure the component is fully rendered
    const timer = setTimeout(() => {
      const scrollContainer = document.querySelector('.scroll-container');
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll);
        // Initial check
        checkScrollState(scrollContainer as HTMLElement);
        
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      const scrollContainer = document.querySelector('.scroll-container');
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Break up the content into paragraphs
  const formatContent = (content: string) => {
    return content.split('\n\n').map((paragraph, index) => (
      <p key={index} className="text-sm md:text-base leading-relaxed mb-4 last:mb-0">
        {paragraph}
      </p>
    ));
  };

  return (
    <div className="relative w-full h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left Side - Pink Background */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full bg-[hsl(var(--accent-pink))] text-white pt-40 pb-24 md:p-8 lg:p-12 px-4 md:px-8 lg:px-12 flex flex-col justify-center">
        <h1 className="font-brutalist text-xl md:text-2xl lg:text-4xl leading-tight mb-4 md:mb-6 lg:mb-8 tracking-tight">
          {title}
        </h1>
        <div className="relative">
          <div className="scroll-container max-h-[40vh] md:max-h-[60vh] overflow-y-auto pr-2 md:pr-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {formatContent(leftContent)}
          </div>
          {showScrollIndicator && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
              <ChevronDown className="h-4 w-4 md:h-6 md:w-6" />
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative flex flex-col">
        <OptimizedImage
          src={rightImage}
          alt="Cocktail"
          className="w-full h-full object-cover"
        />
        {/* Title overlay - no background box */}
        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 text-white">
          <h2 className="font-brutalist text-sm md:text-lg lg:text-xl font-bold tracking-tight">
            {rightTitle}
          </h2>
        </div>
      </div>

      {/* Croft Logo Watermark */}
      <div className="absolute top-2 right-2 md:top-4 md:right-4 opacity-20 z-10">
        <CroftLogo className="h-8 w-8 md:h-12 md:w-12 text-white" />
      </div>
    </div>
  );
};