import React from 'react';
import CroftLogo from '@/components/CroftLogo';
import OptimizedImage from '@/components/OptimizedImage';
import { FramedBox } from '@/components/ui/FramedBox';

interface SplitLayoutWithTitleSlideProps {
  title: string;
  leftContent: string;
  rightImage: string;
}

export const SplitLayoutWithTitleSlide: React.FC<SplitLayoutWithTitleSlideProps> = ({
  title,
  leftContent,
  rightImage
}) => {
  return (
    <section className="h-screen flex overflow-hidden">
      {/* Left Content */}
      <div className="w-1/2 bg-background flex flex-col justify-center p-12 relative">
        {/* Logo Watermark */}
        <div className="absolute top-6 right-6 z-20">
          <CroftLogo size="md" className="opacity-60" />
        </div>
        
        <div className="space-y-8">
          <FramedBox
            as="h2"
            size="lg"
            contrast="neutral"
            className="text-3xl md:text-4xl font-brutalist text-foreground border-2 p-6 hover:!border-current hover:!text-current"
          >
            {title}
          </FramedBox>
          
          <div className="space-y-6">
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-brutalist text-[hsl(var(--accent-pink))] leading-tight">
              {leftContent.split('\n\n')[0]}
            </h3>
            
            <div className="text-2xl md:text-3xl lg:text-4xl font-industrial leading-relaxed text-muted-foreground space-y-4">
              {leftContent.split('\n\n').slice(1).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Image */}
      <div className="w-1/2 relative">
        <OptimizedImage
          src={rightImage}
          alt="Courtyard space"
          className="w-full h-full object-cover"
          priority
        />
      </div>
    </section>
  );
};