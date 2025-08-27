import OptimizedNavigation from './OptimizedNavigation';
import HeroCarousel from './HeroCarousel';
import OptimizedFooter from './OptimizedFooter';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  return (
    <div className="min-h-screen">
      <OptimizedNavigation />
      <HeroCarousel />
      {children}
      <OptimizedFooter />
    </div>
  );
};

export default PageLayout;