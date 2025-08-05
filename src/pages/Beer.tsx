import PageLayout from '@/components/PageLayout';

const Beer = () => {
  return (
    <PageLayout>
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground">
            BEER
          </h2>
          <p className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Carefully curated selection of local brews and international favorites. From crisp lagers to bold IPAs, 
            discover your perfect pint in our relaxed, community-focused atmosphere.
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default Beer;