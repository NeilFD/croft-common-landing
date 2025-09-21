import OptimizedNavigation from './OptimizedNavigation';
import HeroCarousel from './HeroCarousel';
import OptimizedFooter from './OptimizedFooter';
import { MobileDebugPanel } from './MobileDebugPanel';
import { DEBUG_SESSION_ID } from '@/pwa/notifications';

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
      {/* Global debug panel, opens via 7-tap watermark gesture */}
      <MobileDebugPanel sessionId={DEBUG_SESSION_ID} />
    </div>
  );
};

export default PageLayout;