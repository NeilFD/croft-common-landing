import PageLayout from '@/components/PageLayout';
import HallHeroCarousel from '@/components/HallHeroCarousel';

const Hall = () => {
  return (
    <PageLayout>
      <HallHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground">
            HALL
          </h2>
          <p className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            An empty room. Blank canvas. Full sound. Weddings. Gigs. Raves. Strip it back. Fill it up.
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default Hall;