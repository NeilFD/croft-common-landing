import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { HeroSlide } from '@/components/slides/HeroSlide';
import { LeftAlignedSlide } from '@/components/slides/LeftAlignedSlide';
import { RightAlignedSlide } from '@/components/slides/RightAlignedSlide';
import { CenteredSlide } from '@/components/slides/CenteredSlide';
import { ThreeColumnSlide } from '@/components/slides/ThreeColumnSlide';
import { GallerySlide } from '@/components/slides/GallerySlide';
import { HalfScreenSlide } from '@/components/slides/HalfScreenSlide';
import { SplitLayoutSlide } from '@/components/slides/SplitLayoutSlide';
import { Users, Utensils, Star, Clock, MapPin, Mail, Phone, Crown, Zap, Award } from 'lucide-react';

// Slide configurations for 40 slides
const slideConfigs = [
  { type: 'HERO', title: 'CROFT COMMON', subtitle: 'STOKES CROFT, BRISTOL', backgroundImage: '/lovable-uploads/a20eefb2-138d-41f1-9170-f68dd99a63bc.png', noOverlay: true },
  { type: 'CENTERED', title: 'Rooted in the neighbourhood. Alive with city energy.', subtitle: 'This is Croft Common — where Bristol meets, eats, and stays a little longer than planned...', backgroundColor: 'accent' },
  { 
    type: 'CENTERED', 
    title: 'TENANT OPPORTUNITY PROPOSAL', 
    backgroundColor: 'accent',
    leftContent: "We are pleased to offer a unique opportunity for a small number of exceptional food businesses to take up residence within The Kitchens at Croft Common, launching in February 2026 in the heart of Stokes Croft. Croft Common is a new landmark hospitality venue combining The Kitchens at Croft Common, a Cocktail Bar, Beer Hall, Café, and Event Space, all under one roof across 16,000 square feet.",
    rightContent: "At its core will sit The Kitchens, a four-unit destination for outstanding, independent food, one operated by Croft Common and three reserved for exciting independent vendors. We are seeking operators with a strong local following, a reputation for quality, and a desire to grow their brand without the cost or commitment of taking on their own premises. This is a rare chance to be part of a high-profile launch in a much-loved area, with infrastructure, marketing support and footfall potential already in place."
  },
  { 
    type: 'CENTERED', 
    title: 'TRADING MADE EASY', 
    subtitle: 'Fully equipped kitchens, simple turnover-based rent, flexible licences and dedicated front-of-house support.',
    backgroundColor: 'accent',
    leftContent: "Each operator will be granted a fully fitted kitchen space within the food hall, complete with kitchen equipment, extraction, cold storage and prep facilities. The precise kitchen specifications will be shared upon request, along with plans and full technical documentation. We are covering the cost of the fit-out in full. Operators will be charged a simple turnover rent, set at 20 percent of net sales. There is no base rent. A service charge will also apply, with the amount currently being finalised based on projected operations costs.",
    rightContent: "The Kitchens will be open seven days a week, with trading expected from midday until close each evening. Last orders will typically be around 10pm on weekdays and 11pm on weekends. All vendors will be expected to trade throughout these hours unless a different arrangement is agreed in advance. Croft Common will provide all front of house staff, table runners and bar staff. This means vendors can focus entirely on delivering exceptional food with their own kitchen teams. Orders will be taken via Square POS, with a combination of table service and table ordering using QR codes or NFC tags. We are designing the system to feel seamless and intuitive for customers."
  },
  { 
    type: 'SPLIT_LAYOUT', 
    title: 'PROMOTION & POSITIONING', 
    rightTitle: 'Next steps',
    leftContent: "Marketing and PR for the venue as a whole will be led by the Team at Croft Common. This includes the initial launch campaign, press outreach, brand partnerships and social media. We will also support each vendor's individual story and aim to foster an atmosphere of collaboration between all parties. Our curatorial approach blends high standards with community roots. We want to bring together a collection of food concepts that are both original and accessible, that reflect the vibrancy of the area while elevating the overall customer experience.",
    rightContent: "If you would like to be considered for one of the three kitchen spaces, we would love to hear from you. We are offering private tours, design walk-throughs and commercial meetings across the coming months. We are also happy to share our projected financials and detailed layout plans. To arrange a time to speak or visit the site, please contact: Neil Fincham-Dukes, Founding Partner, Croft Common and City & Sanctuary, neil@cityandsanctuary.com. We look forward to welcoming the first wave of partners to Croft Common and creating something extraordinary together."
  },
  { type: 'HERO', title: 'WELCOME TO CROFT COMMON.', subtitle: 'A NEW ADDITION TO STOKES CROFT AND MAYBE YOUR NEW FAVOURITE PLACE...', backgroundImage: '/lovable-uploads/b0fe37fa-228e-460f-9c90-99ed660449b6.png' },
  { type: 'HALF_SCREEN', backgroundImage: '/lovable-uploads/a0587370-62e3-43a1-aad1-10c43e42b909.png', content: "Shaped by the streets of Stokes Croft, we've refurbished a landmark building and reimagined it as a space to gather, make, eat, drink, and stay a while. The energy of Stokes Croft has always been there — creative, raw, full of potential. Croft Common is a place that reflects that energy. Somewhere where the atmosphere's easy, the crowd's like-minded, and the experiences just happen.\n\nThis is a venue that moves with you. From weekday mornings to late-night weekends. From spontaneous drop-ins to planned get-togethers. From first coffee to last call.\n\nStart your day with a coffee from The Café, where the counter is piled high with freshly baked breads and pastries from the city's best local bakeries. On your way to work? Grab and go. Or, take a moment — settle in on The Street Terrace and soak up the morning sun as the neighbourhood comes to life.\n\nAs the day unfolds, The Taproom opens its doors, pouring fresh local craft beers. Next door, the Kitchens fire up — a showcase for Bristol's most exciting chefs and emerging foodies, serving up bold flavours and original ideas.\n\nAt the centre of it all is The Courtyard: an open-air space where you can gather with friends over a pint from The Taproom or plates from the kitchens, all under open skies.\n\nAs night falls, The Café shifts gear. The coffee counter clears, the lights dim, and the space transforms into elegant Cocktail bar with a resident DJs setting the tone deep into the night.\n\nUpstairs, an unique event space full of character hosts the city's best moments — from intimate ceremonies to after-hours celebrations. And above it all, Bristol's only rooftop bar invites you to bask in the sun by day and sip cocktails beneath the stars by night." },
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
            subtitle={slideNumber === 1 || slideNumber === 6 ? config.subtitle : `${config.subtitle} (${slideNumber}/${totalSlides})`}
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
            subtitle={slideNumber === 2 ? config.subtitle : (slideNumber === 3 ? undefined : `${config.subtitle} (${slideNumber}/${totalSlides})`)}
            content={slideNumber === 2 ? '' : (slideNumber === 3 ? undefined : "This is placeholder content for a centered layout. This format works well for quotes, key messages, or important announcements that need maximum visual impact.")}
            leftContent={config.leftContent}
            rightContent={config.rightContent}
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
      
      case 'SPLIT_LAYOUT':
        return (
          <SplitLayoutSlide
            title={config.title}
            rightTitle={config.rightTitle}
            leftContent={config.leftContent}
            rightContent={config.rightContent}
          />
        );
      
      case 'HALF_SCREEN':
        return (
          <HalfScreenSlide
            content={config.content}
            backgroundImage={config.backgroundImage}
            imagePosition="left"
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