import { CMSModeProvider } from '@/contexts/CMSModeContext';
import Footer from '@/components/Footer';

const CMSFooterPreview = () => {
  return (
    <CMSModeProvider isCMSMode={true}>
      <div className="min-h-screen bg-background">
        {/* Minimal page structure to provide context */}
        <div className="flex-1">
          <div className="container mx-auto px-6 py-12">
            <div className="text-center text-muted-foreground">
              <p>Footer Preview</p>
            </div>
          </div>
        </div>
        
        {/* The actual Footer component */}
        <Footer showSubscription={true} />
      </div>
    </CMSModeProvider>
  );
};

export default CMSFooterPreview;