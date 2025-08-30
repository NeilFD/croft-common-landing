import React from 'react';
import OptimizedImage from '@/components/OptimizedImage';
import CroftLogo from '@/components/CroftLogo';
import { FramedBox } from '@/components/ui/FramedBox';

interface HeroSlideProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  logoPosition?: 'top-left' | 'bottom-right';
}

export const HeroSlide: React.FC<HeroSlideProps> = ({
  title,
  subtitle,
  backgroundImage,
  logoPosition = 'bottom-right'
}) => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {backgroundImage && (
        <>
          <OptimizedImage
            src={backgroundImage}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </>
      )}
      
      {/* Logo Watermark */}
      <div className={`absolute z-20 ${logoPosition === 'top-left' ? 'top-6 left-6' : 'bottom-6 right-6'}`}>
        <CroftLogo size="lg" className="opacity-80" />
      </div>
      
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
        <FramedBox
          as="h1"
          size="lg"
          contrast="contrast"
          className="text-6xl md:text-8xl font-brutalist mb-6 p-8 border-4"
        >
          {title}
        </FramedBox>
        
        {subtitle && (
          <p className="text-xl md:text-2xl font-industrial mt-8 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
};