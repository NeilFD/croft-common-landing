import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import KitchensHeroCarousel from '@/components/KitchensHeroCarousel';

const Kitchens = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <KitchensHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground">
            KITCHENS
          </h2>
          <p className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Four vendors. One pass. Food when ready. Simple plates.<br />
            Just noise, heat, and shared tables.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Kitchens;