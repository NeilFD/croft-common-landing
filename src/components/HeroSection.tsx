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
      
      {/* Large watermark icon in center */}
      <div className="absolute inset-0 flex items-center justify-center z-5">
        <img 
          src="/lovable-uploads/a2ee3fd5-4eb3-4a7e-8433-c4bb065295f4.png" 
          alt="Croft Common Watermark" 
          className="w-[60rem] h-[60rem] opacity-10 object-contain filter invert"
        />
      </div>
      
      {/* Title positioned at top of viewport */}
      <div className="fixed top-28 right-2 md:right-4 z-20">
        <h1 className="font-brutalist text-5xl md:text-6xl text-background tracking-tight mb-6 text-right leading-none">
          <span className="block border-t-4 border-b-4 border-background leading-none">CROFT</span>
          <span className="block border-t-4 border-b-4 border-background leading-none">COMMON</span>
        </h1>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-px h-16 bg-background/50"></div>
      </div>
    </section>
  );
};

export default HeroSection;