import CroftLogo from './CroftLogo';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const NotificationsHeader = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-charcoal">
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 flex justify-center items-center relative">
        <Link to="/" className="flex items-center space-x-3 md:space-x-6 hover:opacity-80 transition-opacity">
          <CroftLogo 
            size="lg"
            className="w-10 h-10 md:w-16 md:h-16"
          />
          <div className="font-brutalist text-xl md:text-4xl text-foreground tracking-tight">
            CROFT COMMON
          </div>
        </Link>
        
        <div className="absolute right-4 md:right-6">
          <Button asChild variant="frameNeutral" shape="pill" size="sm" className="md:h-12 md:px-8">
            <Link 
              to="/book" 
              className="h-8 md:h-12 px-3 md:px-8 text-xs md:text-lg font-industrial tracking-wide text-charcoal hover:border-accent-pink"
            >
              BOOK
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default NotificationsHeader;