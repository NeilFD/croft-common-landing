import React from 'react';
import OptimizedImage from '@/components/OptimizedImage';
import CroftLogo from '@/components/CroftLogo';
import { FramedBox } from '@/components/ui/FramedBox';

interface LeftAlignedSlideProps {
  title: string;
  subtitle?: string;
  content?: string;
  image?: string;
  backgroundColor?: 'default' | 'muted';
}

export const LeftAlignedSlide: React.FC<LeftAlignedSlideProps> = ({
  title,
  subtitle,
  content,
  image,
  backgroundColor = 'default'
}) => {
  return (
    <section className={`h-screen flex items-center py-8 md:py-20 px-4 md:px-6 relative ${backgroundColor === 'muted' ? 'bg-muted' : ''}`}>
      {/* Logo Watermark */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-20">
        <CroftLogo size="md" className="opacity-60 h-8 w-8 md:h-auto md:w-auto" />
      </div>
      
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 items-center">
          <div className="space-y-4 md:space-y-6">
            <FramedBox
              as="h2"
              size="lg"
              className="text-2xl md:text-4xl lg:text-5xl font-brutalist text-foreground border-2 p-3 md:p-6"
            >
              {title}
            </FramedBox>
            
            {subtitle && (
              <p className="text-lg md:text-xl text-[hsl(var(--accent-pink))] font-industrial font-bold">
                {subtitle}
              </p>
            )}
            
            {content && (
              <p className="text-sm md:text-lg text-muted-foreground font-industrial leading-relaxed">
                {content}
              </p>
            )}
          </div>
          
          <div className="relative">
            {image ? (
              <OptimizedImage
                src={image}
                alt="Content Image"
                className="w-full h-48 md:h-96 object-cover rounded-lg shadow-brutal border-2 border-foreground"
              />
            ) : (
              <div className="w-full h-48 md:h-96 bg-muted border-2 border-foreground rounded-lg shadow-brutal flex items-center justify-center">
                <p className="text-muted-foreground font-industrial text-sm md:text-base">Image Placeholder</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};