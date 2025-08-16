import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import KitchensHeroCarousel from '@/components/KitchensHeroCarousel';
import { useCMSMode } from '@/contexts/CMSModeContext';

const Kitchens = () => {
  const { isCMSMode } = useCMSMode();

  return (
    <div className="min-h-screen">
      {!isCMSMode && <Navigation />}
      <KitchensHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground">
            KITCHENS
          </h2>
          <p className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Four vendors. Four flavours. Food when ready. Simple.
            <br /><br />
            Noise, heat, and shared tables.
          </p>
        </div>
      </section>
      {!isCMSMode && <Footer />}
    </div>
  );
};

export default Kitchens;