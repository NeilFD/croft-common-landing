import PageLayout from '@/components/PageLayout';

const Kitchens = () => {
  return (
    <PageLayout>
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground">
            KITCHENS
          </h2>
          <p className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Fresh, seasonal ingredients meet bold flavors. Our kitchen philosophy embraces simplicity and quality, 
            creating dishes that nourish and inspire the Croft Common community.
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default Kitchens;