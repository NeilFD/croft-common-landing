import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Fixed watermark with pixel-perfect background inversion */}
      <div className="fixed inset-0 flex items-center justify-center z-10 pointer-events-none">
        <img 
          src="/lovable-uploads/a2ee3fd5-4eb3-4a7e-8433-c4bb065295f4.png" 
          alt="Croft Common Watermark" 
          className="w-[60rem] h-[60rem] opacity-30 object-contain filter brightness-0 invert"
          style={{ 
            mixBlendMode: 'difference',
            filter: 'brightness(0) invert(1) contrast(2)'
          }}
        />
      </div>
      
      <Navigation />
      <HeroSection />
      <AboutSection />
      <Footer />
    </div>
  );
};

export default Index;
