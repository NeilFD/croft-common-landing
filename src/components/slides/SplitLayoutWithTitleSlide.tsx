import React from 'react';
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
    <section className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left Content */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full bg-background flex flex-col justify-center pt-40 pb-24 md:p-8 lg:p-12 px-4 md:px-8 lg:px-12 relative overflow-y-auto">
        <div className="space-y-4 md:space-y-6 lg:space-y-8">
          <FramedBox
            as="h2"
            size="lg"
            contrast="neutral"
            className="text-lg md:text-2xl lg:text-3xl xl:text-4xl font-brutalist text-foreground border-2 p-3 md:p-4 lg:p-6 hover:!border-current hover:!text-current"
          >
            {title}
          </FramedBox>
          
          <div className="space-y-3 md:space-y-4 lg:space-y-6">
            <h3 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-brutalist text-[hsl(var(--accent-pink))] leading-tight">
              {leftContent.split('\n\n')[0]}
            </h3>
            
            <div className="text-sm md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-industrial leading-relaxed text-muted-foreground space-y-2 md:space-y-3 lg:space-y-4">
              {leftContent.split('\n\n').slice(1).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Image */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative">
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