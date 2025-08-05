import Navigation from '@/components/Navigation';
import CafeHeroCarousel from '@/components/CafeHeroCarousel';
import Footer from '@/components/Footer';

const Cafe = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <CafeHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground">
            CAFÉ
          </h2>
          <p className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Open early. Concrete counters. Black coffee. Warm light. A place to meet, work, linger. Music & movement.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Cafe;