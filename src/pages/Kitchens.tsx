import PageLayout from '@/components/PageLayout';
import KitchensHeroCarousel from '@/components/KitchensHeroCarousel';

const Kitchens = () => {
  return (
    <PageLayout>
      <KitchensHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground">
            KITCHENS
          </h2>
          <p className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Four vendors. One pass. Food when ready. Simple plates. 
            Just noise, heat, and shared tables.
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default Kitchens;