import React from 'react';
import CroftLogo from '@/components/CroftLogo';

interface ListSlideProps {
  items: string[];
  backgroundColor?: string;
}

export const ListSlide: React.FC<ListSlideProps> = ({
  items,
  backgroundColor = 'accent',
}) => {
  const getBackgroundClass = () => {
    switch (backgroundColor) {
      case 'accent':
        return 'bg-[hsl(var(--accent-pink))]';
      case 'muted':
        return 'bg-muted';
      default:
        return 'bg-background';
    }
  };

  return (
    <section className={`relative h-screen flex items-center justify-center overflow-hidden ${getBackgroundClass()}`}>
      {/* Content */}
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
        <div className="space-y-8 md:space-y-12">
          {/* Top decorative line */}
          <div className="w-96 h-0.5 bg-white mx-auto"></div>
          
          {/* List items */}
          <div className="space-y-6 md:space-y-8">
            {items.map((item, index) => (
              <div key={index} className="font-industrial text-3xl md:text-4xl lg:text-5xl tracking-wider uppercase">
                {item}
              </div>
            ))}
          </div>
          
          {/* Bottom decorative line */}
          <div className="w-96 h-0.5 bg-white mx-auto"></div>
        </div>
      </div>

      {/* Croft Logo Watermark */}
      <div className="absolute top-6 right-6 opacity-20 z-20">
        <CroftLogo size="lg" className="opacity-80" />
      </div>
    </section>
  );
};