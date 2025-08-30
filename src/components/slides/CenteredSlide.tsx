import React from 'react';
import CroftLogo from '@/components/CroftLogo';
import { FramedBox } from '@/components/ui/FramedBox';

interface CenteredSlideProps {
  title: string;
  subtitle?: string;
  content?: string;
  leftContent?: string;
  rightContent?: string;
  backgroundColor?: 'default' | 'muted' | 'accent';
}

export const CenteredSlide: React.FC<CenteredSlideProps> = ({
  title,
  subtitle,
  content,
  leftContent,
  rightContent,
  backgroundColor = 'default'
}) => {
  const bgClass = backgroundColor === 'muted' ? 'bg-muted' : 
                  backgroundColor === 'accent' ? 'bg-[hsl(var(--accent-pink))]' : '';
  
  const textColor = backgroundColor === 'accent' ? 'text-white' : 'text-foreground';
  const subtitleColor = backgroundColor === 'accent' ? 'text-white/90' : 'text-[hsl(var(--accent-pink))]';
  const contentColor = backgroundColor === 'accent' ? 'text-white/80' : 'text-muted-foreground';
  
  const isTwoColumn = leftContent && rightContent;

  return (
    <section className={`h-screen flex items-center py-20 px-6 relative ${bgClass}`}>
      {/* Logo Watermark */}
      <div className="absolute top-6 right-6 z-20">
        <CroftLogo size="md" className="opacity-60" />
      </div>
      
      <div className={`max-w-6xl mx-auto w-full ${isTwoColumn ? 'space-y-6' : 'text-center space-y-8'}`}>
        <FramedBox
          as="h2"
          size="lg"
          contrast={backgroundColor === 'accent' ? 'contrast' : 'neutral'}
          className={`text-4xl md:text-5xl font-brutalist ${textColor} border-2 p-8 ${isTwoColumn ? 'text-center' : ''}`}
        >
          {title}
        </FramedBox>
        
        {subtitle && !isTwoColumn && (
          <p className={`text-xl font-industrial font-bold ${subtitleColor}`}>
            {subtitle}
          </p>
        )}
        
        {content && !isTwoColumn && (
          <p className={`text-lg font-industrial leading-relaxed max-w-3xl mx-auto ${contentColor}`}>
            {content}
          </p>
        )}
        
        {isTwoColumn && (
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 mt-8">
            <div className="space-y-4">
              <p className={`text-lg font-industrial leading-relaxed ${contentColor}`}>
                {leftContent}
              </p>
            </div>
            <div className="space-y-4">
              <p className={`text-lg font-industrial leading-relaxed ${contentColor}`}>
                {rightContent}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};