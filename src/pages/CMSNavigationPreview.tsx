import { CMSModeProvider } from '@/contexts/CMSModeContext';
import Navigation from '@/components/Navigation';

const CMSNavigationPreview = () => {
  return (
    <CMSModeProvider isCMSMode={true}>
      <div className="min-h-screen bg-background">
        {/* The actual Navigation component */}
        <Navigation />
        
        {/* Content area to show the navigation properly */}
        <div className="pt-24 px-6">
          <div className="container mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-4">Navigation Preview</h2>
            <p className="text-muted-foreground">
              You're editing the site navigation. Changes will apply to all pages.
            </p>
          </div>
        </div>
      </div>
    </CMSModeProvider>
  );
};

export default CMSNavigationPreview;