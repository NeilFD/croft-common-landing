import Navigation from '@/components/Navigation';
import KitchensHeroCarousel from '@/components/KitchensHeroCarousel';
import Footer from '@/components/Footer';

const Kitchens = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <KitchensHeroCarousel />
      <Footer />
    </div>
  );
};

export default Kitchens;