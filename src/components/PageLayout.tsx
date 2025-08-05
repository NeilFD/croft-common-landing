import Navigation from './Navigation';
import HeroCarousel from './HeroCarousel';
import Footer from './Footer';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroCarousel />
      {children}
      <Footer />
    </div>
  );
};

export default PageLayout;