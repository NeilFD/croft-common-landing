import PageLayout from '@/components/PageLayout';

const Cocktails = () => {
  return (
    <PageLayout>
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground">
            COCKTAILS
          </h2>
          <p className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Evening transforms our space into a cocktail destination. Classic techniques meet creative flair, 
            crafting drinks that capture the spirit of Bristol's most dynamic neighborhood.
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default Cocktails;