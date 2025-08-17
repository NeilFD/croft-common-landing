import Navigation from '@/components/Navigation';
import CafeHeroCarousel from '@/components/CafeHeroCarousel';
import Footer from '@/components/Footer';
import { CMSText } from '@/components/cms/CMSText';
import { useCMSMode } from '@/contexts/CMSModeContext';
import { EnhancedMetaTags } from "@/components/SEO/EnhancedMetaTags";
import { StructuredData, useRestaurantSchema, useBreadcrumbSchema } from "@/components/SEO/StructuredData";
import { FAQSection } from "@/components/SEO/FAQSection";
import { useSEO } from "@/hooks/useSEO";

const Cafe = () => {
  const { isCMSMode } = useCMSMode();
  const seoData = useSEO();
  const restaurantSchema = useRestaurantSchema('/cafe');
  const breadcrumbSchema = useBreadcrumbSchema('/cafe');

  return (
    <div className="min-h-screen">
      <EnhancedMetaTags
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        url={seoData.url}
        type={seoData.type}
        restaurant={{
          cuisine: ["Cafe", "Coffee", "Light Bites"],
          priceRange: "£",
          acceptsReservations: false
        }}
      />
      <StructuredData data={restaurantSchema} />
      <StructuredData data={breadcrumbSchema} />
      
      {!isCMSMode && <Navigation />}
      <CafeHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <CMSText
            page="cafe"
            section="main"
            contentKey="title"
            fallback="CAFÉ"
            as="h1"
            className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground"
          />
          <CMSText
            page="cafe"
            section="main"
            contentKey="description"
            fallback="Open early. Concrete counters. Black coffee. Warm light. A place to meet, A place to work, A place to linger.

Music & movement."
            as="p"
            className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed"
          />
        </div>
      </section>
      {!isCMSMode && (
        <>
          <FAQSection 
            page="cafe"
            title="Café FAQ"
            className="bg-muted/30"
          />
          <Footer />
        </>
      )}
    </div>
  );
};

export default Cafe;