import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import HallHeroCarousel from '@/components/HallHeroCarousel';
import MenuButton from '@/components/MenuButton';
import { hallMenuData } from '@/data/menuData';
import CMSPageHeader from '@/components/cms/CMSPageHeader';

const Hall = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HallHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <CMSPageHeader
            page="hall"
            defaultTitle="HALL"
            defaultDescription="An empty room. Blank canvas. Full sound. Lights cut. Walls shake. Life's big moments.

Strip it back. Fill it up."
            titleClassName="font-brutalist text-4xl md:text-6xl mb-8 text-foreground transition-all duration-300 hover:opacity-80 cursor-pointer"
          />
        </div>
      </section>
      <Footer />
      <MenuButton pageType="hall" menuData={hallMenuData} />
    </div>
  );
};

export default Hall;