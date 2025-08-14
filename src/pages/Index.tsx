import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import SubscriptionForm from "@/components/SubscriptionForm";
import Footer from "@/components/Footer";
import { ServiceWorkerDebug } from "@/components/ServiceWorkerDebug";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      
      <Footer />
      <div className="fixed bottom-4 right-4 z-50">
        <ServiceWorkerDebug />
      </div>
    </div>
  );
};

export default Index;