import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import { useWatermarkColor } from "@/hooks/useWatermarkColor";

const Index = () => {
  const watermarkColor = useWatermarkColor();

  return (
    <div className="min-h-screen">
      {/* Smart watermark with smooth color transitions */}
      <div className="fixed inset-0 flex items-center justify-center z-10 pointer-events-none">
        <img 
          src="/lovable-uploads/a2ee3fd5-4eb3-4a7e-8433-c4bb065295f4.png" 
          alt="Croft Common Watermark" 
          className="w-[60rem] h-[60rem] opacity-40 object-contain transition-all duration-500 ease-out"
          data-watermark="true"
          style={{ 
            filter: `brightness(0) saturate(100%) invert(1)`,
            color: `rgb(${watermarkColor})`,
            WebkitMaskImage: `url('/lovable-uploads/a2ee3fd5-4eb3-4a7e-8433-c4bb065295f4.png')`,
            maskImage: `url('/lovable-uploads/a2ee3fd5-4eb3-4a7e-8433-c4bb065295f4.png')`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            backgroundColor: `rgb(${watermarkColor})`
          }}
        />
      </div>
      
      <Navigation />
      <div data-section="hero">
        <HeroSection />
      </div>
      <div data-section="about">
        <AboutSection />
      </div>
      <div data-section="footer">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
