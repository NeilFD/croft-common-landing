import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import SubscriptionForm from "@/components/SubscriptionForm";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      
      {/* Prominent subscription section */}
      <section className="py-20 bg-background border-t border-foreground/10">
        <div className="container mx-auto px-6">
          <SubscriptionForm variant="homepage" />
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;