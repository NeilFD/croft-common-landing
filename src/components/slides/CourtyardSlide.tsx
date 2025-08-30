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
      {/* Left Side - Black Background with Title Only */}
      <div className="w-1/2 bg-black text-white p-8 md:p-12 flex flex-col justify-center items-center">
        <h1 className="font-brutalist text-4xl md:text-6xl leading-tight tracking-tight text-white text-center">
          {title}
        </h1>
      </div>

      {/* Right Side - Image */}
      <div className="w-1/2 relative">
        <img 
          src={rightImage} 
          alt="The Courtyard space" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Croft Logo Watermark */}
      <div className="absolute top-4 right-4 opacity-20">
        <CroftLogo className="h-12 w-12" />
      </div>
    </div>
  );
};