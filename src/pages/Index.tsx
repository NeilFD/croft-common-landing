import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import SubscriptionForm from "@/components/SubscriptionForm";
import Footer from "@/components/Footer";
import { useCMSMode } from "@/contexts/CMSModeContext";
import { EnhancedMetaTags } from "@/components/SEO/EnhancedMetaTags";
import { StructuredData, useOrganizationSchema, useRestaurantSchema, useBreadcrumbSchema } from "@/components/SEO/StructuredData";
import { FAQSection } from "@/components/SEO/FAQSection";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";


const Index = () => {
  const { isCMSMode } = useCMSMode();
  const navigate = useNavigate();
  const seoData = useSEO();
  const organizationSchema = useOrganizationSchema();
  const restaurantSchema = useRestaurantSchema('/');
  const breadcrumbSchema = useBreadcrumbSchema('/');


  return (
    <div className="min-h-screen">
      <EnhancedMetaTags
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        url={seoData.url}
        type={seoData.type}
        restaurant={{
          cuisine: ["British", "International", "Pub Food"],
          priceRange: "££",
          acceptsReservations: true
        }}
      />
      <StructuredData data={organizationSchema} />
      <StructuredData data={restaurantSchema} />
      <StructuredData data={breadcrumbSchema} />
      
      {!isCMSMode && <Navigation />}
      <HeroSection />
      
      {!isCMSMode && (
        <>
          {/* Uncommon Standards Section */}
          <div className="py-16 bg-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <p className="text-xl text-muted-foreground leading-relaxed text-left mb-8">
                  Hospitality should be felt, not just promised. These are the standards we hold ourselves to, written plainly and lived daily.
                </p>
                <div className="text-center">
                  <Button
                    onClick={() => navigate('/uncommon-standards')}
                    className="w-64 h-16 border-2 border-foreground bg-transparent text-foreground font-medium text-lg hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                    variant="outline"
                  >
                    Uncommon Standards
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <FAQSection 
            page="home"
            title="Frequently Asked Questions"
            className="bg-background"
          />
          
          <Footer />
        </>
      )}
    </div>
  );
};

export default Index;