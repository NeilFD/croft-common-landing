import React from 'react';
import CroftLogo from '@/components/CroftLogo';
import { FramedBox } from '@/components/ui/FramedBox';

interface CenteredSlideProps {
  title: string;
  subtitle?: string;
  content?: string;
  backgroundColor?: 'default' | 'muted' | 'accent';
}

export const CenteredSlide: React.FC<CenteredSlideProps> = ({
  title,
  subtitle,
  content,
  backgroundColor = 'default'
}) => {
  const bgClass = backgroundColor === 'muted' ? 'bg-muted' : 
                  backgroundColor === 'accent' ? 'bg-[hsl(var(--accent-pink))]' : '';
  
  const textColor = backgroundColor === 'accent' ? 'text-white' : 'text-foreground';
  const subtitleColor = backgroundColor === 'accent' ? 'text-white/90' : 'text-[hsl(var(--accent-pink))]';
  const contentColor = backgroundColor === 'accent' ? 'text-white/80' : 'text-muted-foreground';

  return (
    <section className={`h-screen flex items-center py-20 px-6 relative ${bgClass}`}>
      {/* Logo Watermark */}
      <div className="absolute top-6 right-6 z-20">
        <CroftLogo size="md" className="opacity-60" />
      </div>
      
      <div className="max-w-4xl mx-auto text-center w-full space-y-8">
        <FramedBox
          as="h2"
          size="lg"
          contrast={backgroundColor === 'accent' ? 'contrast' : 'neutral'}
          className={`text-4xl md:text-5xl font-brutalist ${textColor} border-2 p-8`}
        >
          {title}
        </FramedBox>
        
        {subtitle && (
          <p className={`text-xl font-industrial font-bold ${subtitleColor}`}>
            {subtitle}
          </p>
        )}
        
        {content && (
          <p className={`text-lg font-industrial leading-relaxed max-w-3xl mx-auto ${contentColor}`}>
            {content}
          </p>
        )}
      </div>
    </section>
  );
};