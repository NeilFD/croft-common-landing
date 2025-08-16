import Navigation from '@/components/Navigation';
import CocktailHeroCarousel from '@/components/CocktailHeroCarousel';
import Footer from '@/components/Footer';
import CMSPageHeader from '@/components/cms/CMSPageHeader';

const Cocktails = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <CocktailHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <CMSPageHeader
            page="cocktails"
            defaultTitle="COCKTAILS"
            defaultDescription="Lights down. Bottles up. Zinc Top. Sharp drinks. Soft shadows. Built for late.

Vibe"
          />
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Cocktails;