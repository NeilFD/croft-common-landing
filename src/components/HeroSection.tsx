const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/00e4abb5-7048-4240-9a07-44d31b238a96.png')`
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-void/40"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-brutalist text-6xl md:text-8xl text-background tracking-tight mb-6">
            CROFT
            <br />
            COMMON
          </h1>
          
          <div className="w-24 h-1 bg-accent-pink mx-auto mb-8"></div>
          
          <p className="font-industrial text-xl md:text-2xl text-background/90 max-w-2xl mx-auto leading-relaxed">
            Moody, modular hospitality in the heart of Stokes Croft—
            <br />
            where food, drink, and people collide.
          </p>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-px h-16 bg-background/50"></div>
      </div>
    </section>
  );
};

export default HeroSection;