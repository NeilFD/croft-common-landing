import { CMSModeProvider } from '@/contexts/CMSModeContext';
import SubscriptionForm from '@/components/SubscriptionForm';

const CMSSubscriptionPreview = () => {
  return (
    <CMSModeProvider isCMSMode={true}>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-2xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-4">Subscription Form Preview</h2>
            <p className="text-muted-foreground">
              This form appears on the homepage and in the footer.
            </p>
          </div>
          
          {/* Homepage variant */}
          <div className="mb-12">
            <h3 className="text-lg font-medium mb-4 text-center">Homepage Variant</h3>
            <SubscriptionForm variant="homepage" />
          </div>
          
          {/* Footer variant */}
          <div className="bg-void text-background p-8 rounded-lg">
            <h3 className="text-lg font-medium mb-4 text-center text-background">Footer Variant</h3>
            <SubscriptionForm variant="footer" />
          </div>
        </div>
      </div>
    </CMSModeProvider>
  );
};

export default CMSSubscriptionPreview;