import React from 'react';
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
  return (
    <div className="relative w-full h-screen flex overflow-hidden">
      {/* Left Side - Pink Background */}
      <div className="w-1/2 bg-[hsl(var(--accent-pink))] text-white p-8 md:p-12 flex flex-col justify-center">
        <h1 className="font-brutalist text-2xl md:text-4xl leading-tight mb-6 md:mb-8 tracking-tight">
          {title}
        </h1>
        <div className="max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          <p className="text-sm md:text-base leading-relaxed">
            {leftContent}
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="w-1/2 relative flex flex-col">
        <OptimizedImage
          src={rightImage}
          alt="Cocktail"
          className="w-full h-full object-cover"
        />
        {/* Title overlay */}
        <div className="absolute bottom-8 right-8 bg-black/50 text-white p-4 rounded">
          <h2 className="font-industrial text-lg md:text-xl font-bold tracking-tight">
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