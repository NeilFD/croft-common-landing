import Navigation from '@/components/Navigation';
import CafeHeroCarousel from '@/components/CafeHeroCarousel';
import Footer from '@/components/Footer';
import { CMSText } from '@/components/cms/CMSText';
import { useCMSMode } from '@/contexts/CMSModeContext';

const Cafe = () => {
  const { isCMSMode } = useCMSMode();

  return (
    <div className="min-h-screen">
      {!isCMSMode && <Navigation />}
      <CafeHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <CMSText
            page="cafe"
            section="main"
            contentKey="title"
            fallback="CAFÉ"
            as="h2"
            className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground"
          />
          <CMSText
            page="cafe"
            section="main"
            contentKey="description"
            fallback="Open early. Concrete counters. Black coffee. Warm light. A place to meet, A place to work, A place to linger.

Music & movement."
            as="p"
            className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed"
          />
        </div>
      </section>
      {!isCMSMode && <Footer />}
    </div>
  );
};

export default Cafe;