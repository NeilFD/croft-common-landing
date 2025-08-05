import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import { useWatermarkColor } from "@/hooks/useWatermarkColor";

const Index = () => {
  const isDarkBackground = useWatermarkColor();

  return (
    <div className="min-h-screen">
      {/* Fixed watermark that adapts to background colors */}
      <div className="fixed inset-0 flex items-center justify-center z-10 pointer-events-none">
        <img 
          src="/lovable-uploads/a2ee3fd5-4eb3-4a7e-8433-c4bb065295f4.png" 
          alt="Croft Common Watermark" 
          data-watermark
          className={`w-[60rem] h-[60rem] opacity-25 object-contain transition-all duration-500 ${
            isDarkBackground 
              ? 'filter brightness-0 invert' // White watermark on dark backgrounds
              : 'filter brightness-0' // Black watermark on light backgrounds
          }`}
        />
      </div>
      
      <Navigation />
      <div data-bg-type="dark">
        <HeroSection />
      </div>
      <div data-bg-type="light">
        <AboutSection />
      </div>
      <div data-bg-type="dark">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
