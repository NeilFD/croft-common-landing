import Navigation from '@/components/Navigation';
import CocktailHeroCarousel from '@/components/CocktailHeroCarousel';
import Footer from '@/components/Footer';

const Cocktails = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <CocktailHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground">
            COCKTAILS
          </h2>
          <p className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Lights down. Bottles up. Zinc Top. Sharp drinks. Soft shadows. Built for late.
            <br /><br />
            Vibe
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Cocktails;