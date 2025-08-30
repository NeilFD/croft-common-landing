import React from 'react';
import CroftLogo from '@/components/CroftLogo';
import { FramedBox } from '@/components/ui/FramedBox';
import { Card, CardContent } from '@/components/ui/card';

interface ColumnItem {
  title: string;
  content: string;
  icon?: React.ReactNode;
}

interface ThreeColumnSlideProps {
  title: string;
  subtitle?: string;
  columns: [ColumnItem, ColumnItem, ColumnItem];
  backgroundColor?: 'default' | 'muted';
}

export const ThreeColumnSlide: React.FC<ThreeColumnSlideProps> = ({
  title,
  subtitle,
  columns,
  backgroundColor = 'default'
}) => {
  return (
    <section className={`h-screen flex items-center py-20 relative ${backgroundColor === 'muted' ? 'bg-muted' : ''}`}>
      {/* Logo Watermark */}
      <div className="absolute top-6 left-6 z-20">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {columns.map((column, index) => (
            <Card key={index} className="border-2 border-foreground shadow-brutal hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center">
                {column.icon && (
                  <div className="mb-4 flex justify-center">
                    <div className="text-[hsl(var(--accent-pink))]">
                      {column.icon}
                    </div>
                  </div>
                )}
                
                <FramedBox
                  as="h3"
                  shape="pill"
                  className="text-xl font-brutalist mb-4 text-foreground"
                >
                  {column.title}
                </FramedBox>
                
                <p className="text-muted-foreground font-industrial leading-relaxed">
                  {column.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};