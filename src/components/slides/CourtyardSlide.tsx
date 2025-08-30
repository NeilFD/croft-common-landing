import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import CroftLogo from '@/components/CroftLogo';

interface CourtyardSlideProps {
  title: string;
  rightTitle?: string;
  leftContent: string;
  rightContent?: string;
  rightImage?: string;
}

export const CourtyardSlide: React.FC<CourtyardSlideProps> = ({
  title,
  rightTitle,
  leftContent,
  rightContent,
  rightImage,
}) => {
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.courtyard-scroll-container');
      if (scrollContainer) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const isScrollable = scrollHeight > clientHeight;
        const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
        setShowScrollIndicator(isScrollable && !isAtBottom);
      }
    };

    const scrollContainer = document.querySelector('.courtyard-scroll-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
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
    <div className="relative w-full h-screen flex overflow-hidden">
      {/* Left Side - Black Background with Scrollable Text */}
      <div className="w-1/2 bg-black text-white p-8 md:p-12 flex flex-col relative">
        <div className="courtyard-scroll-container flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
          <div className="text-sm md:text-base leading-relaxed">
            {formatContent(leftContent)}
          </div>
        </div>
        
        {/* Scroll Indicator */}
        {showScrollIndicator && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-6 w-6 text-white" />
          </div>
        )}
      </div>

      {/* Right Side - Image with Title Overlay */}
      <div className="w-1/2 relative">
        {rightImage ? (
          <div className="h-full relative">
            <img 
              src={rightImage} 
              alt="Courtyard space" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-between p-8 md:p-12">
              <h1 className="font-brutalist text-4xl md:text-5xl leading-tight tracking-tight text-white text-center">
                {title}
              </h1>
              {rightTitle && (
                <h2 className="font-industrial text-2xl md:text-3xl text-white text-center leading-tight tracking-tight">
                  {rightTitle}
                </h2>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white text-black p-8 md:p-12 flex flex-col justify-center h-full">
            <h1 className="font-brutalist text-4xl md:text-5xl leading-tight mb-6 md:mb-8 tracking-tight text-center">
              {title}
            </h1>
            {rightTitle && (
              <h2 className="font-industrial text-2xl md:text-3xl leading-tight mb-6 md:mb-8 tracking-tight">
                {rightTitle}
              </h2>
            )}
            {rightContent && (
              <div className="text-sm md:text-base leading-relaxed max-w-xl">
                {formatContent(rightContent)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Croft Logo Watermark */}
      <div className="absolute top-4 right-4 opacity-20">
        <CroftLogo className="h-12 w-12" />
      </div>
    </div>
  );
};