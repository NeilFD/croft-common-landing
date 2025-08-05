const AboutSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-brutalist text-4xl md:text-6xl text-foreground mb-8 leading-tight">
              BUILT FOR
              <br />
              FLOW
            </h2>
            
            <div className="w-16 h-1 bg-accent-pink mb-8"></div>
            
            <p className="font-industrial text-lg text-steel leading-relaxed mb-6">
              Part food hall, part café, part cocktail bar, part beer hall. 
              Set across shifting zones with shared tables, sharp edges, 
              and industrial charm.
            </p>
            
            <p className="font-industrial text-lg text-steel leading-relaxed">
              Concrete, metal, and warm light frame a day-to-night rhythm—
              no fuss, no fluff, just well-built hospitality.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-concrete h-48"></div>
            <div className="bg-charcoal h-48 mt-8"></div>
            <div className="bg-accent-pink h-32 -mt-4"></div>
            <div className="bg-steel h-40"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;