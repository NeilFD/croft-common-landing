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
      
      {/* Fixed watermark on hero only */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-16">
        <img 
          src="/lovable-uploads/a2ee3fd5-4eb3-4a7e-8433-c4bb065295f4.png" 
          alt="Croft Common Watermark" 
          className="w-[40rem] h-[40rem] opacity-40 object-contain"
          style={{ 
            filter: 'brightness(0) saturate(100%) invert(1)'
          }}
        />
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-px h-16 bg-background/50"></div>
      </div>
    </section>
  );
};

export default HeroSection;