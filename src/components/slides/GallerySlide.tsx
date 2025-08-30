import React from 'react';
import OptimizedImage from '@/components/OptimizedImage';
import CroftLogo from '@/components/CroftLogo';
import { FramedBox } from '@/components/ui/FramedBox';

interface GalleryItem {
  image?: string;
  title: string;
  description: string;
}

interface GallerySlideProps {
  title: string;
  subtitle?: string;
  items: GalleryItem[];
  backgroundColor?: 'default' | 'muted';
  columns?: 2 | 3 | 4;
}

export const GallerySlide: React.FC<GallerySlideProps> = ({
  title,
  subtitle,
  items,
  backgroundColor = 'default',
  columns = 3
}) => {
  const gridCols = columns === 2 ? 'md:grid-cols-2' : 
                   columns === 3 ? 'md:grid-cols-2 lg:grid-cols-3' : 
                   'md:grid-cols-2 lg:grid-cols-4';

  return (
    <section className={`h-screen flex items-center py-20 relative ${backgroundColor === 'muted' ? 'bg-muted' : ''}`}>
      {/* Logo Watermark */}
      <div className="absolute bottom-6 left-6 z-20">
        <CroftLogo size="md" className="opacity-60" />
      </div>
      
      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="text-center mb-16">
          <FramedBox
            as="h2"
            size="lg"
            className="text-4xl md:text-5xl font-brutalist mb-6 text-foreground border-2 p-6 inline-block"
          >
            {title}
          </FramedBox>
          
          {subtitle && (
            <p className="text-xl text-[hsl(var(--accent-pink))] max-w-3xl mx-auto font-industrial mt-6">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`grid grid-cols-1 ${gridCols} gap-8`}>
          {items.map((item, index) => (
            <div key={index} className="relative group">
              {item.image ? (
                <OptimizedImage
                  src={item.image}
                  alt={item.title}
                  className="w-full h-64 object-cover rounded-lg shadow-brutal border-2 border-foreground group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-64 bg-muted border-2 border-foreground rounded-lg shadow-brutal flex items-center justify-center">
                  <p className="text-muted-foreground font-industrial">Image Placeholder</p>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/40 rounded-lg flex items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="p-6 w-full">
                  <FramedBox
                    as="h3"
                    contrast="contrast"
                    className="text-white font-brutalist text-xl mb-2"
                  >
                    {item.title}
                  </FramedBox>
                  <p className="text-white/90 font-industrial">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};