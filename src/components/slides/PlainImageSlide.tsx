import React from 'react';
import OptimizedImage from '@/components/OptimizedImage';

interface PlainImageSlideProps {
  backgroundImage: string;
  alt?: string;
}

export const PlainImageSlide: React.FC<PlainImageSlideProps> = ({
  backgroundImage,
  alt = "Slide image"
}) => {
  return (
    <section className="relative h-screen flex overflow-hidden">
      <OptimizedImage
        src={backgroundImage}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        priority
      />
    </section>
  );
};