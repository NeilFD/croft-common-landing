import PageLayout from '@/components/PageLayout';

const Cafe = () => {
  return (
    <PageLayout>
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground">
            CAFE
          </h2>
          <p className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Start your day with expertly crafted coffee, fresh pastries, and the vibrant energy of Stokes Croft. 
            Our cafe space welcomes the community from first light.
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default Cafe;