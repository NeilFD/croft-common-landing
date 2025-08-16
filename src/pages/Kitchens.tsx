import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import KitchensHeroCarousel from '@/components/KitchensHeroCarousel';
import CMSPageHeader from '@/components/cms/CMSPageHeader';

const Kitchens = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <KitchensHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <CMSPageHeader
            page="kitchens"
            defaultTitle="KITCHENS"
            defaultDescription="Four vendors. Four flavours. Food when ready. Simple.

Noise, heat, and shared tables."
          />
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Kitchens;