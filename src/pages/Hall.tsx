import PageLayout from '@/components/PageLayout';

const Hall = () => {
  return (
    <PageLayout>
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground">
            HALL
          </h2>
          <p className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            The heart of Croft Common. Our main hall brings people together for dining, events, and connection. 
            A space designed for community, conversation, and shared experiences.
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default Hall;