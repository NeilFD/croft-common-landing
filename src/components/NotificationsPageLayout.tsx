import NotificationsHeader from './NotificationsHeader';
import NotificationsHeroCarousel from './NotificationsHeroCarousel';
import Footer from './Footer';

interface NotificationsPageLayoutProps {
  children: React.ReactNode;
}

const NotificationsPageLayout = ({ children }: NotificationsPageLayoutProps) => {
  return (
    <div className="min-h-screen">
      <NotificationsHeader />
      <div className="relative">
        <NotificationsHeroCarousel />
        {children}
      </div>
      <Footer />
    </div>
  );
};

export default NotificationsPageLayout;