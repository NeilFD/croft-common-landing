import Navigation from '@/components/Navigation';
import BeerHeroCarousel from '@/components/BeerHeroCarousel';
import Footer from '@/components/Footer';

const Beer = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <BeerHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground">
            BEER
          </h2>
          <p className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Steel lines. Long tables. Cold pints. No pretence, we're all friends, warm sounds.
            <br /><br />
            Big heart.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Beer;