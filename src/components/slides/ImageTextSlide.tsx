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
    <div className="relative w-full h-screen flex overflow-hidden">
      {/* Left Side - Pink Background */}
      <div className="w-1/2 bg-[hsl(var(--accent-pink))] text-white p-8 md:p-12 flex flex-col justify-center">
        <h1 className="font-brutalist text-2xl md:text-4xl leading-tight mb-6 md:mb-8 tracking-tight">
          {title}
        </h1>
        <div className="relative">
          <div className="scroll-container max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {formatContent(leftContent)}
          </div>
          {showScrollIndicator && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
              <ChevronDown className="h-6 w-6" />
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="w-1/2 relative flex flex-col">
        <OptimizedImage
          src={rightImage}
          alt="Cocktail"
          className="w-full h-full object-cover"
        />
        {/* Title overlay - no background box */}
        <div className="absolute bottom-8 right-8 text-white">
          <h2 className="font-brutalist text-lg md:text-xl font-bold tracking-tight">
            {rightTitle}
          </h2>
        </div>
      </div>

      {/* Croft Logo Watermark */}
      <div className="absolute top-4 right-4 opacity-20 z-10">
        <CroftLogo className="h-12 w-12 text-white" />
      </div>
    </div>
  );
};