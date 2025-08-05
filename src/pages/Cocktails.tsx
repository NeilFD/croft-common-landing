import Navigation from '@/components/Navigation';
import CocktailHeroCarousel from '@/components/CocktailHeroCarousel';
import Footer from '@/components/Footer';

const Cocktails = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <CocktailHeroCarousel />
      <Footer />
    </div>
  );
};

export default Cocktails;