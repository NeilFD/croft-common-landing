import Navigation from '@/components/Navigation';
import CocktailHeroCarousel from '@/components/CocktailHeroCarousel';
import Footer from '@/components/Footer';
import { useCMSMode } from '@/contexts/CMSModeContext';
import { CMSText } from '@/components/cms/CMSText';

const Cocktails = () => {
  const { isCMSMode } = useCMSMode();

  return (
    <div className="min-h-screen">
      {!isCMSMode && <Navigation />}
      <CocktailHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <CMSText 
            page="cocktails" 
            section="hero" 
            contentKey="title" 
            fallback="COCKTAILS"
            as="h2"
            className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground"
          />
          <CMSText 
            page="cocktails" 
            section="hero" 
            contentKey="description" 
            fallback="Lights down. Bottles up. Zinc Top. Sharp drinks. Soft shadows. Built for late.\n\nVibe"
            as="p"
            className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed whitespace-pre-line"
          />
        </div>
      </section>
      {!isCMSMode && <Footer />}
    </div>
  );
};

export default Cocktails;