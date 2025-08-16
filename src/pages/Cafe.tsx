import Navigation from '@/components/Navigation';
import CafeHeroCarousel from '@/components/CafeHeroCarousel';
import Footer from '@/components/Footer';
import CMSPageHeader from '@/components/cms/CMSPageHeader';

const Cafe = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <CafeHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <CMSPageHeader
            page="cafe"
            defaultTitle="CAFÉ"
            defaultDescription="Open early. Concrete counters. Black coffee. Warm light. A place to meet, A place to work, A place to linger.

Music & movement."
          />
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Cafe;