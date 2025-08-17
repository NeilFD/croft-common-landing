import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import SubscriptionForm from "@/components/SubscriptionForm";
import Footer from "@/components/Footer";
import { useCMSMode } from "@/contexts/CMSModeContext";
import { EnhancedMetaTags } from "@/components/SEO/EnhancedMetaTags";
import { StructuredData, useOrganizationSchema, useRestaurantSchema, useBreadcrumbSchema } from "@/components/SEO/StructuredData";
import { FAQSection } from "@/components/SEO/FAQSection";
import { useSEO } from "@/hooks/useSEO";


const Index = () => {
  const { isCMSMode } = useCMSMode();
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