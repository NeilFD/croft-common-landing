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
      <div className="relative z-10 w-full px-6">
        <div className="absolute top-16 right-6 md:right-12">
          <h1 className="font-brutalist text-6xl md:text-8xl text-background tracking-tight mb-6 text-right">
            <span className="block border-t-4 border-b-4 border-background">CROFT</span>
            <span className="block border-t-4 border-b-4 border-background mt-2">COMMON</span>
          </h1>
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