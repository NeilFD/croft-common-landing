import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import SubscriptionForm from "@/components/SubscriptionForm";
import Footer from "@/components/Footer";
import { useCMSMode } from "@/contexts/CMSModeContext";


const Index = () => {
  const { isCMSMode } = useCMSMode();

  return (
    <div className="min-h-screen">
      {!isCMSMode && <Navigation />}
      <HeroSection />
      
      {!isCMSMode && <Footer />}
    </div>
  );
};

export default Index;