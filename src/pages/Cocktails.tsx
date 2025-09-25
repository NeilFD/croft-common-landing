import Navigation from '@/components/Navigation';
import CocktailHeroCarousel from '@/components/CocktailHeroCarousel';
import Footer from '@/components/Footer';
import { useCMSMode } from '@/contexts/CMSModeContext';
import { CMSText } from '@/components/cms/CMSText';
import { EnhancedMetaTags } from "@/components/SEO/EnhancedMetaTags";
import { StructuredData, useRestaurantSchema, useBreadcrumbSchema } from "@/components/SEO/StructuredData";
import { FAQSection } from "@/components/SEO/FAQSection";
import { useSEO } from "@/hooks/useSEO";

const Cocktails = () => {
  const { isCMSMode } = useCMSMode();
  const seoData = useSEO();
  const restaurantSchema = useRestaurantSchema('/cocktails');
  const breadcrumbSchema = useBreadcrumbSchema('/cocktails');

  return (
    <div className="min-h-screen">
      <EnhancedMetaTags
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        url={seoData.url}
        type={seoData.type}
        restaurant={{
          cuisine: ["Cocktails", "Drinks", "Bar"],
          priceRange: "££",
          acceptsReservations: false
        }}
      />
      <StructuredData data={restaurantSchema} />
      <StructuredData data={breadcrumbSchema} />
      
      {!isCMSMode && <Navigation />}
      <CocktailHeroCarousel />
      <section className="pb-24 bg-background" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 140px)' }}>
        <div className="container mx-auto px-6 text-center">
          <CMSText 
            page="cocktails" 
            section="hero" 
            contentKey="title" 
            fallback="COCKTAILS"
            as="h1"
            className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground"
          />
          <CMSText 
            page="cocktails" 
            section="hero" 
            contentKey="description" 
            fallback="Lights down. Bottles up. Zinc Top. Sharp drinks. Soft shadows. Built for late.\n\nVibe"
            as="p"
            className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed whitespace-pre-line"
          />
        </div>
      </section>
      
      {!isCMSMode && (
        <>
          <FAQSection 
            page="cocktails"
            title="Cocktails FAQ"
            className="bg-muted/30"
          />
          <Footer />
        </>
      )}
    </div>
  );
};

export default Cocktails;