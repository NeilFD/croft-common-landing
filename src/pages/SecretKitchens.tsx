import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { HeroSlide } from '@/components/slides/HeroSlide';
import { LeftAlignedSlide } from '@/components/slides/LeftAlignedSlide';
import { RightAlignedSlide } from '@/components/slides/RightAlignedSlide';
import { CenteredSlide } from '@/components/slides/CenteredSlide';
import { ThreeColumnSlide } from '@/components/slides/ThreeColumnSlide';
import { GallerySlide } from '@/components/slides/GallerySlide';
import { Users, Utensils, Star, Clock, MapPin, Mail, Phone, Crown, Zap, Award } from 'lucide-react';

// Slide configurations for 40 slides
const slideConfigs = [
  { type: 'HERO', title: 'CROFT COMMON', subtitle: 'STOKES CROFT, BRISTOL', backgroundImage: '/lovable-uploads/a20eefb2-138d-41f1-9170-f68dd99a63bc.png', noOverlay: true },
  { type: 'CENTERED', title: 'Rooted in the neighbourhood. Alive with city energy.', subtitle: 'This is Croft Common — where Bristol meets, eats, and stays a little longer than planned...', backgroundColor: 'accent' },
  { type: 'RIGHT_ALIGNED', title: 'SLIDE 3', subtitle: 'Right Aligned Layout', content: 'Content placeholder for right aligned slide layout.' },
  { type: 'CENTERED', title: 'SLIDE 4', subtitle: 'Centered Layout', content: 'Content placeholder for centered slide layout.' },
  { type: 'THREE_COLUMN', title: 'SLIDE 5', subtitle: 'Three Column Layout' },
  { type: 'GALLERY', title: 'SLIDE 6', subtitle: 'Gallery Layout' },
  { type: 'HERO', title: 'SLIDE 7', subtitle: 'Second Hero Layout' },
  { type: 'LEFT_ALIGNED', title: 'SLIDE 8', subtitle: 'Left Layout Variant', backgroundColor: 'muted' },
  { type: 'RIGHT_ALIGNED', title: 'SLIDE 9', subtitle: 'Right Layout Variant', backgroundColor: 'muted' },
  { type: 'CENTERED', title: 'SLIDE 10', subtitle: 'Centered Accent', backgroundColor: 'accent' },
  { type: 'THREE_COLUMN', title: 'SLIDE 11', subtitle: 'Three Column Variant', backgroundColor: 'muted' },
  { type: 'GALLERY', title: 'SLIDE 12', subtitle: 'Gallery 4 Column', columns: 4 },
  { type: 'HERO', title: 'SLIDE 13', subtitle: 'Third Hero Layout' },
  { type: 'LEFT_ALIGNED', title: 'SLIDE 14', subtitle: 'Left Layout Standard' },
  { type: 'RIGHT_ALIGNED', title: 'SLIDE 15', subtitle: 'Right Layout Standard' },
  { type: 'CENTERED', title: 'SLIDE 16', subtitle: 'Centered Standard' },
  { type: 'THREE_COLUMN', title: 'SLIDE 17', subtitle: 'Three Column Standard' },
  { type: 'GALLERY', title: 'SLIDE 18', subtitle: 'Gallery 2 Column', columns: 2 },
  { type: 'HERO', title: 'SLIDE 19', subtitle: 'Fourth Hero Layout' },
  { type: 'LEFT_ALIGNED', title: 'SLIDE 20', subtitle: 'Left Layout Final', backgroundColor: 'muted' },
  { type: 'RIGHT_ALIGNED', title: 'SLIDE 21', subtitle: 'Right Layout Final' },
  { type: 'CENTERED', title: 'SLIDE 22', subtitle: 'Centered Final', backgroundColor: 'muted' },
  { type: 'THREE_COLUMN', title: 'SLIDE 23', subtitle: 'Three Column Final' },
  { type: 'GALLERY', title: 'SLIDE 24', subtitle: 'Gallery Final' },
  { type: 'HERO', title: 'SLIDE 25', subtitle: 'Fifth Hero Layout' },
  { type: 'LEFT_ALIGNED', title: 'SLIDE 26', subtitle: 'Left Layout Extra' },
  { type: 'RIGHT_ALIGNED', title: 'SLIDE 27', subtitle: 'Right Layout Extra', backgroundColor: 'muted' },
  { type: 'CENTERED', title: 'SLIDE 28', subtitle: 'Centered Extra' },
  { type: 'THREE_COLUMN', title: 'SLIDE 29', subtitle: 'Three Column Extra', backgroundColor: 'muted' },
  { type: 'GALLERY', title: 'SLIDE 30', subtitle: 'Gallery Extra' },
  { type: 'HERO', title: 'SLIDE 31', subtitle: 'Sixth Hero Layout' },
  { type: 'LEFT_ALIGNED', title: 'SLIDE 32', subtitle: 'Left Layout Bonus', backgroundColor: 'muted' },
  { type: 'RIGHT_ALIGNED', title: 'SLIDE 33', subtitle: 'Right Layout Bonus' },
  { type: 'CENTERED', title: 'SLIDE 34', subtitle: 'Centered Bonus', backgroundColor: 'accent' },
  { type: 'THREE_COLUMN', title: 'SLIDE 35', subtitle: 'Three Column Bonus' },
  { type: 'GALLERY', title: 'SLIDE 36', subtitle: 'Gallery Bonus', columns: 4 },
  { type: 'HERO', title: 'SLIDE 37', subtitle: 'Seventh Hero Layout' },
  { type: 'LEFT_ALIGNED', title: 'SLIDE 38', subtitle: 'Left Layout Final Set' },
  { type: 'RIGHT_ALIGNED', title: 'SLIDE 39', subtitle: 'Right Layout Final Set', backgroundColor: 'muted' },
  { type: 'CENTERED', title: 'SLIDE 40', subtitle: 'Final Slide', backgroundColor: 'accent' }
];

// Sample data for three column slides
const sampleColumns: [
  { title: string; content: string; icon: React.ReactNode },
  { title: string; content: string; icon: React.ReactNode },
  { title: string; content: string; icon: React.ReactNode }
] = [
  { title: 'Feature One', content: 'Description for the first feature or benefit.', icon: <Crown className="h-12 w-12" /> },
  { title: 'Feature Two', content: 'Description for the second feature or benefit.', icon: <Zap className="h-12 w-12" /> },
  { title: 'Feature Three', content: 'Description for the third feature or benefit.', icon: <Award className="h-12 w-12" /> }
];

// Sample data for gallery slides
const sampleGalleryItems = [
  { title: 'Gallery Item 1', description: 'Description for first gallery item' },
  { title: 'Gallery Item 2', description: 'Description for second gallery item' },
  { title: 'Gallery Item 3', description: 'Description for third gallery item' },
  { title: 'Gallery Item 4', description: 'Description for fourth gallery item' }
];

const SecretKitchens = () => {
  const renderSlide = (config: any, index: number) => {
    const slideNumber = index + 1;
    const totalSlides = slideConfigs.length;
    
    switch (config.type) {
      case 'HERO':
        return (
          <HeroSlide
            title={config.title}
            subtitle={slideNumber === 1 ? config.subtitle : `${config.subtitle} (${slideNumber}/${totalSlides})`}
            backgroundImage={config.backgroundImage}
            logoPosition={index % 2 === 0 ? 'bottom-right' : 'top-left'}
            noOverlay={config.noOverlay}
          />
        );
      
      case 'LEFT_ALIGNED':
        return (
          <LeftAlignedSlide
            title={config.title}
            subtitle={`${config.subtitle} (${slideNumber}/${totalSlides})`}
            content="This is placeholder content that will be replaced with your actual copy. The layout demonstrates left-aligned content with space for imagery on the right side."
            backgroundColor={config.backgroundColor}
          />
        );
      
      case 'RIGHT_ALIGNED':
        return (
          <RightAlignedSlide
            title={config.title}
            subtitle={`${config.subtitle} (${slideNumber}/${totalSlides})`}
            content="This is placeholder content that will be replaced with your actual copy. The layout demonstrates right-aligned content with space for imagery on the left side."
            backgroundColor={config.backgroundColor}
          />
        );
      
      case 'CENTERED':
        return (
          <CenteredSlide
            title={config.title}
            subtitle={slideNumber === 2 ? config.subtitle : `${config.subtitle} (${slideNumber}/${totalSlides})`}
            content={slideNumber === 2 ? '' : "This is placeholder content for a centered layout. This format works well for quotes, key messages, or important announcements that need maximum visual impact."}
            backgroundColor={config.backgroundColor}
          />
        );
      
      case 'THREE_COLUMN':
        return (
          <ThreeColumnSlide
            title={config.title}
            subtitle={`${config.subtitle} (${slideNumber}/${totalSlides})`}
            columns={sampleColumns}
            backgroundColor={config.backgroundColor}
          />
        );
      
      case 'GALLERY':
        return (
          <GallerySlide
            title={config.title}
            subtitle={`${config.subtitle} (${slideNumber}/${totalSlides})`}
            items={sampleGalleryItems.slice(0, config.columns || 3)}
            backgroundColor={config.backgroundColor}
            columns={config.columns || 3}
          />
        );
      
      default:
        return (
          <CenteredSlide
            title="Unknown Layout"
            subtitle="Template Error"
            content="This slide type is not recognized."
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Carousel className="w-full h-screen">
        <CarouselContent>
          {slideConfigs.map((config, index) => (
            <CarouselItem key={index}>
              {renderSlide(config, index)}
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <CarouselPrevious className="left-4 bg-black/80 border-2 border-[hsl(var(--accent-pink))] text-white hover:bg-[hsl(var(--accent-pink))] hover:text-black shadow-brutal" />
        <CarouselNext className="right-4 bg-black/80 border-2 border-[hsl(var(--accent-pink))] text-white hover:bg-[hsl(var(--accent-pink))] hover:text-black shadow-brutal" />
        
        {/* Slide Counter */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full font-industrial text-sm border-2 border-[hsl(var(--accent-pink))]">
          <span className="text-[hsl(var(--accent-pink))]">●</span> Use arrows to navigate between slides
        </div>
      </Carousel>
    </div>
  );
};

export default SecretKitchens;