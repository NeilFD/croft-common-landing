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
    <div className="relative w-full h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left Side - Black Background with Title Only */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full bg-black text-white p-4 md:p-8 lg:p-12 flex flex-col justify-center items-center">
        <h1 className="font-brutalist text-2xl md:text-4xl lg:text-6xl leading-tight tracking-tight text-white text-center">
          {title}
        </h1>
      </div>

      {/* Right Side - Image */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative">
        <img 
          src={rightImage} 
          alt="The Courtyard space" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Croft Logo Watermark */}
      <div className="absolute top-2 right-2 md:top-4 md:right-4 opacity-20">
        <CroftLogo className="h-8 w-8 md:h-12 md:w-12" />
      </div>
    </div>
  );
};