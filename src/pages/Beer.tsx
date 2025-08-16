import Navigation from '@/components/Navigation';
import BeerHeroCarousel from '@/components/BeerHeroCarousel';
import Footer from '@/components/Footer';
import CMSPageHeader from '@/components/cms/CMSPageHeader';

const Beer = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <BeerHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <CMSPageHeader
            page="beer"
            defaultTitle="BEER"
            defaultDescription="Steel lines. Long tables. Cold pints. No pretence, we're all friends, warm sounds.

Big heart."
          />
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Beer;