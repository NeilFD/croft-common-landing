import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import KitchensHeroCarousel from '@/components/KitchensHeroCarousel';
import { useCMSMode } from '@/contexts/CMSModeContext';
import { CMSText } from '@/components/cms/CMSText';
import { EnhancedMetaTags } from "@/components/SEO/EnhancedMetaTags";
import { StructuredData, useRestaurantSchema, useBreadcrumbSchema } from "@/components/SEO/StructuredData";
import { FAQSection } from "@/components/SEO/FAQSection";
import { useSEO } from "@/hooks/useSEO";

const Kitchens = () => {
  const { isCMSMode } = useCMSMode();
  const seoData = useSEO();
  const restaurantSchema = useRestaurantSchema('/kitchens');
  const breadcrumbSchema = useBreadcrumbSchema('/kitchens');

  return (
    <div className="min-h-screen">
      <EnhancedMetaTags
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        url={seoData.url}
        type={seoData.type}
        restaurant={{
          cuisine: ["Street Food", "International", "Fast Casual"],
          priceRange: "££",
          acceptsReservations: false
        }}
      />
      <StructuredData data={restaurantSchema} />
      <StructuredData data={breadcrumbSchema} />
      
      {!isCMSMode && <Navigation />}
      <KitchensHeroCarousel />
      <section className="pb-24 bg-background" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 140px)' }}>
        <div className="container mx-auto px-6 text-center">
          <CMSText 
            page="kitchens" 
            section="hero" 
            contentKey="title" 
            fallback="KITCHENS"
            as="h1"
            className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground"
          />
          <CMSText 
            page="kitchens" 
            section="hero" 
            contentKey="description" 
            fallback="Four vendors. Four flavours. Food when ready. Simple.\n\nNoise, heat, and shared tables."
            as="p"
            className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed whitespace-pre-line"
          />
        </div>
      </section>
      
      {!isCMSMode && (
        <>
          <FAQSection 
            page="kitchens"
            title="Kitchens FAQ"
            className="bg-muted/30"
          />
          <Footer />
        </>
      )}
    </div>
  );
};

export default Kitchens;