import React from 'react';
import OptimizedImage from '@/components/OptimizedImage';
import CroftLogo from '@/components/CroftLogo';

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
  return (
    <div className="relative w-full h-screen flex overflow-hidden">
      {/* Image Side */}
      <div className={`w-1/2 relative ${imagePosition === 'right' ? 'order-2' : 'order-1'}`}>
        <OptimizedImage
          src={backgroundImage}
          alt="Croft Common"
          className="absolute inset-0 w-full h-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Content Side */}
      <div className={`w-1/2 bg-black text-white p-6 md:p-8 flex flex-col justify-center ${imagePosition === 'right' ? 'order-1' : 'order-2'}`}>
        <div className="max-w-full">
          {title && (
            <h1 className="font-brutalist text-2xl md:text-3xl leading-tight mb-4 md:mb-6 tracking-tight">
              {title}
            </h1>
          )}
          <div className="text-xs md:text-sm leading-relaxed space-y-3 md:space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            {content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-white/90">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Croft Logo Watermark */}
      <div className="absolute top-4 right-4 opacity-20 z-10">
        <CroftLogo className="h-10 w-10 md:h-12 md:w-12" />
      </div>
    </div>
  );
};