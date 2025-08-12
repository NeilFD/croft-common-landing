import CroftLogo from './CroftLogo';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const NotificationsHeader = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-charcoal">
      <div className="container mx-auto px-6 py-6 flex justify-center items-center">
        <div className="flex items-center space-x-6">
          <CroftLogo 
            size="lg"
            className="w-16 h-16"
          />
          <div className="font-brutalist text-4xl text-foreground tracking-tight">
            CROFT COMMON
          </div>
        </div>
        
        <div className="absolute right-6">
          <Button asChild variant="frameNeutral" shape="pill" size="sm">
            <Link 
              to="/book" 
              className="h-8 px-4 text-sm font-industrial tracking-wide text-charcoal hover:border-accent-pink"
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