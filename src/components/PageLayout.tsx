import OptimizedNavigation from './OptimizedNavigation';
import HeroCarousel from './HeroCarousel';
import OptimizedFooter from './OptimizedFooter';
import { MobileDebugPanel } from './MobileDebugPanel';
import { EmergencyDevHotspot } from './EmergencyDevHotspot';
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
      {/* Global debug panel, opens via long-press watermark gesture or 7-tap */}
      <MobileDebugPanel sessionId={DEBUG_SESSION_ID} />
      {/* Emergency dev hotspot (bottom-left corner) */}
      <EmergencyDevHotspot />
    </div>
  );
};

export default PageLayout;