import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Fixed watermark with pixel-perfect background inversion */}
      <div className="fixed inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div 
          className="w-[60rem] h-[60rem] opacity-40 bg-white"
          style={{ 
            mixBlendMode: 'difference',
            mask: 'url(/lovable-uploads/a2ee3fd5-4eb3-4a7e-8433-c4bb065295f4.png) center/contain no-repeat',
            WebkitMask: 'url(/lovable-uploads/a2ee3fd5-4eb3-4a7e-8433-c4bb065295f4.png) center/contain no-repeat'
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
