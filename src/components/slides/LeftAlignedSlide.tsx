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
    <section className={`h-screen flex items-center py-20 px-6 relative ${backgroundColor === 'muted' ? 'bg-muted' : ''}`}>
      {/* Logo Watermark */}
      <div className="absolute bottom-6 right-6 z-20">
        <CroftLogo size="md" className="opacity-60" />
      </div>
      
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <FramedBox
              as="h2"
              size="lg"
              className="text-4xl md:text-5xl font-brutalist text-foreground border-2 p-6"
            >
              {title}
            </FramedBox>
            
            {subtitle && (
              <p className="text-xl text-[hsl(var(--accent-pink))] font-industrial font-bold">
                {subtitle}
              </p>
            )}
            
            {content && (
              <p className="text-lg text-muted-foreground font-industrial leading-relaxed">
                {content}
              </p>
            )}
          </div>
          
          <div className="relative">
            {image ? (
              <OptimizedImage
                src={image}
                alt="Content Image"
                className="w-full h-96 object-cover rounded-lg shadow-brutal border-2 border-foreground"
              />
            ) : (
              <div className="w-full h-96 bg-muted border-2 border-foreground rounded-lg shadow-brutal flex items-center justify-center">
                <p className="text-muted-foreground font-industrial">Image Placeholder</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};