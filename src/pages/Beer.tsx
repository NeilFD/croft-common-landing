import Navigation from '@/components/Navigation';
import BeerHeroCarousel from '@/components/BeerHeroCarousel';
import Footer from '@/components/Footer';
import { useCMSMode } from '@/contexts/CMSModeContext';
import { CMSText } from '@/components/cms/CMSText';
import { EnhancedMetaTags } from "@/components/SEO/EnhancedMetaTags";
import { StructuredData, useRestaurantSchema, useBreadcrumbSchema } from "@/components/SEO/StructuredData";
import { FAQSection } from "@/components/SEO/FAQSection";
import { useSEO } from "@/hooks/useSEO";

const Beer = () => {
  const { isCMSMode } = useCMSMode();
  const seoData = useSEO();
  const restaurantSchema = useRestaurantSchema('/beer');
  const breadcrumbSchema = useBreadcrumbSchema('/beer');

  const beerFAQs = [
    {
      question: "What types of beer do you serve?",
      answer: "We offer a carefully curated selection of craft beers and traditional ales, including local brews, seasonal specials, and classic favorites served fresh from our steel lines."
    },
    {
      question: "Do you have beer tasting events?",
      answer: "Yes! We regularly host beer tasting events and brewery nights. Check our calendar for upcoming events and special beer releases."
    },
    {
      question: "Can I book a table for just drinks?",
      answer: "Absolutely! Our long tables and comfortable seating are perfect for drinks with friends. No food order required - just good company and cold pints."
    },
    {
      question: "Do you serve food with your beer?",
      answer: "Yes, our kitchen serves perfectly paired pub food that complements our beer selection. From hearty meals to light snacks, we have something for every appetite."
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
          cuisine: ["Pub Food", "British"],
          priceRange: "££",
          acceptsReservations: true
        }}
      />
      <StructuredData data={restaurantSchema} />
      <StructuredData data={breadcrumbSchema} />
      
      {!isCMSMode && <Navigation />}
      <BeerHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <CMSText 
            page="beer" 
            section="hero" 
            contentKey="title" 
            fallback="BEER"
            as="h1"
            className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground"
          />
          <CMSText 
            page="beer" 
            section="hero" 
            contentKey="description" 
            fallback="Steel lines. Long tables. Cold pints. No pretence, we're all friends, warm sounds.\n\nBig heart."
            as="p"
            className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed whitespace-pre-line"
          />
        </div>
      </section>
      
      {!isCMSMode && (
        <>
          <FAQSection 
            faqs={beerFAQs}
            title="Beer & Drinks FAQ"
            className="bg-muted/30"
          />
          <Footer />
        </>
      )}
    </div>
  );
};

export default Beer;