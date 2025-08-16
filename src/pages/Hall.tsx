import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import HallHeroCarousel from '@/components/HallHeroCarousel';
import MenuButton from '@/components/MenuButton';
import { hallMenuData } from '@/data/menuData';
import { useCMSMode } from '@/contexts/CMSModeContext';

const Hall = () => {
  const { isCMSMode } = useCMSMode();

  return (
    <div className="min-h-screen">
      {!isCMSMode && <Navigation />}
      <HallHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground transition-all duration-300 hover:opacity-80 cursor-pointer">
            HALL
          </h2>
          <p className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            An empty room. Blank canvas. Full sound. Lights cut. Walls shake. Life's big moments. 
            <br /><br />
            Strip it back. Fill it up.
          </p>
        </div>
      </section>
      {!isCMSMode && <Footer />}
      {!isCMSMode && <MenuButton pageType="hall" menuData={hallMenuData} />}
    </div>
  );
};

export default Hall;