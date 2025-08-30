import React from 'react';
import OptimizedImage from '@/components/OptimizedImage';
import CroftLogo from '@/components/CroftLogo';
import { FramedBox } from '@/components/ui/FramedBox';

interface HeroSlideProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  logoPosition?: 'top-left' | 'bottom-right';
  noOverlay?: boolean;
}

export const HeroSlide: React.FC<HeroSlideProps> = ({
  title,
  subtitle,
  backgroundImage,
  logoPosition = 'bottom-right',
  noOverlay = true
}) => {
  return (
    <section className="relative h-screen flex overflow-hidden">
      {backgroundImage && (
        <>
          <OptimizedImage
            src={backgroundImage}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover"
            priority
          />
          {!noOverlay && <div className="absolute inset-0 bg-black/60"></div>}
        </>
      )}
      
      {/* Logo Watermark */}
      <div className={`absolute z-20 ${logoPosition === 'top-left' ? 'top-6 left-6' : 'bottom-6 right-6'}`}>
        <CroftLogo size="lg" className="opacity-80" />
      </div>
      
      {/* Title in bottom left corner */}
      <div className="absolute bottom-8 left-8 z-10">
        <FramedBox
          as="h1"
          size="sm"
          contrast="contrast"
          className="text-2xl md:text-3xl font-brutalist border-2 px-4 py-2"
        >
          {title}
        </FramedBox>
      </div>
    </section>
  );
};