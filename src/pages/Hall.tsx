import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import HallHeroCarousel from '@/components/HallHeroCarousel';
import MenuButton from '@/components/MenuButton';
import { hallMenuData } from '@/data/menuData';
import { useCMSMode } from '@/contexts/CMSModeContext';
import { CMSText } from '@/components/cms/CMSText';

const Hall = () => {
  const { isCMSMode } = useCMSMode();

  return (
    <div className="min-h-screen">
      {!isCMSMode && <Navigation />}
      <HallHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <CMSText 
            page="hall" 
            section="header" 
            contentKey="title" 
            fallback="HALL"
            as="h2"
            className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground transition-all duration-300 hover:opacity-80 cursor-pointer"
          />
          <CMSText 
            page="hall" 
            section="header" 
            contentKey="description" 
            fallback="An empty room. Blank canvas. Full sound. Lights cut. Walls shake. Life's big moments. Strip it back. Fill it up."
            as="p"
            className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed"
          />
        </div>
      </section>
      {!isCMSMode && <Footer />}
      {!isCMSMode && <MenuButton pageType="hall" menuData={hallMenuData} />}
    </div>
  );
};

export default Hall;