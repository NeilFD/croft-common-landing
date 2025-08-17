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

  const homeFAQs = [
    {
      question: "What is Croft Common?",
      answer: "Croft Common is a vibrant community space offering exceptional food, craft beer, cocktails, and memorable events. We're a place where neighbors become friends and experiences become memories."
    },
    {
      question: "What type of food do you serve?",
      answer: "We serve a diverse menu featuring British and international cuisine, made with fresh, locally-sourced ingredients. Our kitchen offers everything from light cafe bites to hearty pub meals."
    },
    {
      question: "Do you host private events?",
      answer: "Yes! Our versatile spaces are perfect for private dining, celebrations, meetings, and community gatherings. Contact us to discuss your event needs."
    },
    {
      question: "What are your opening hours?",
      answer: "We're open Monday through Sunday, 9:00 AM to 11:00 PM. Please check our calendar for special events and holiday hours."
    },
    {
      question: "Do you accept reservations?",
      answer: "Yes, we accept reservations for dining. You can book a table through our website or by calling us directly."
    }
  ];

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
            faqs={homeFAQs}
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