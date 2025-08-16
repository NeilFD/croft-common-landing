import Navigation from '@/components/Navigation';
import BeerHeroCarousel from '@/components/BeerHeroCarousel';
import Footer from '@/components/Footer';
import { useCMSMode } from '@/contexts/CMSModeContext';
import { CMSText } from '@/components/cms/CMSText';

const Beer = () => {
  const { isCMSMode } = useCMSMode();

  return (
    <div className="min-h-screen">
      {!isCMSMode && <Navigation />}
      <BeerHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <CMSText 
            page="beer" 
            section="hero" 
            contentKey="title" 
            fallback="BEER"
            as="h2"
            className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground"
          />
          <CMSText 
            page="beer" 
            section="hero" 
            contentKey="description" 
            fallback="Steel lines. Long tables. Cold pints. No pretence, we're all friends, warm sounds.\n\nBig heart."
            as="p"
            className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed whitespace-pre-line"
          />
        </div>
      </section>
      {!isCMSMode && <Footer />}
    </div>
  );
};

export default Beer;