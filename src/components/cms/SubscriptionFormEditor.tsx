import { useRef } from 'react';
import { X, Upload, Eye } from 'lucide-react';
import CroftLogo from '../CroftLogo';
import { CMSText } from './CMSText';
import { useEditMode } from '@/contexts/EditModeContext';
import { Button } from '@/components/ui/button';

interface SubscriptionFormEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
  onViewLive: () => void;
  isPublishing: boolean;
  draftCount: number;
}

const SubscriptionFormEditor = ({ 
  isOpen, 
  onClose, 
  onPublish, 
  onViewLive, 
  isPublishing, 
  draftCount 
}: SubscriptionFormEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isEditMode } = useEditMode();

  const handleClose = () => {
    console.log('Subscription form editor close button clicked');
    onClose();
  };

  const handleBackdropClick = () => {
    console.log('Subscription form editor backdrop clicked');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed top-16 left-0 right-0 bottom-0 bg-void/50 backdrop-blur-sm animate-fade-in flex items-center justify-center p-4 z-30"
      onClick={handleBackdropClick}
    >
      <div 
        ref={containerRef}
        className="bg-background border border-steel/30 rounded-lg w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="bg-background border-b border-steel/20 p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
            <div className="text-foreground flex-shrink-0">
              <CroftLogo size="lg" />
            </div>
            <h1 className="font-brutalist text-lg md:text-xl text-foreground tracking-wider truncate">
              SUBSCRIPTION FORM EDITOR
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {isEditMode && (
              <div className="text-xs text-muted-foreground mr-3">Click text to edit</div>
            )}
            {draftCount > 0 && (
              <Button
                onClick={onPublish}
                disabled={isPublishing}
                className="bg-accent-electric-blue text-white hover:bg-accent-electric-blue/90"
                size="sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isPublishing ? 'Publishing...' : `Publish ${draftCount} changes`}
              </Button>
            )}
            <Button
              onClick={onViewLive}
              variant="outline"
              size="sm"
              className="border-foreground/20 hover:bg-foreground/5"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Live
            </Button>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full border border-background/30 hover:border-steel hover:bg-steel/10 
                transition-all duration-300 flex items-center justify-center flex-shrink-0"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 max-h-[calc(95vh-120px)]">
          <div className="space-y-10 max-w-4xl mx-auto">
            {/* Homepage Section */}
            <div className="space-y-6">
              <h2 className="font-brutalist text-2xl text-foreground tracking-wider border-b border-steel/20 pb-3">
                Homepage Subscription
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Headline
                  </label>
                  <CMSText
                    page="global"
                    section="subscription_form"
                    contentKey="homepage_headline"
                    fallback="Stay in the loop"
                    as="div"
                    className="font-brutalist text-2xl text-foreground tracking-wider"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Description
                  </label>
                  <CMSText
                    page="global"
                    section="subscription_form"
                    contentKey="homepage_description"
                    fallback="Get updates on events, special menus, and community happenings."
                    as="div"
                    className="font-industrial text-lg text-foreground leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <div className="space-y-6">
              <h2 className="font-brutalist text-2xl text-foreground tracking-wider border-b border-steel/20 pb-3">
                Footer Subscription
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Headline
                  </label>
                  <CMSText
                    page="global"
                    section="subscription_form"
                    contentKey="footer_headline"
                    fallback="Join our community"
                    as="div"
                    className="font-brutalist text-xl text-foreground tracking-wider"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Description
                  </label>
                  <CMSText
                    page="global"
                    section="subscription_form"
                    contentKey="footer_description"
                    fallback="Be the first to know about new events and exclusive offers."
                    as="div"
                    className="font-industrial text-base text-foreground leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Messages Section */}
            <div className="space-y-6">
              <h2 className="font-brutalist text-2xl text-foreground tracking-wider border-b border-steel/20 pb-3">
                Form Messages
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                  <label className="text-sm font-medium text-green-700 uppercase tracking-wider mb-2 block">
                    Success Message
                  </label>
                  <CMSText
                    page="global"
                    section="subscription_form"
                    contentKey="success_message"
                    fallback="Thanks for subscribing! Check your email to confirm."
                    as="div"
                    className="font-industrial text-base text-green-800"
                  />
                </div>
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <label className="text-sm font-medium text-red-700 uppercase tracking-wider mb-2 block">
                    Error Message
                  </label>
                  <CMSText
                    page="global"
                    section="subscription_form"
                    contentKey="error_message"
                    fallback="Something went wrong. Please try again."
                    as="div"
                    className="font-industrial text-base text-red-800"
                  />
                </div>
              </div>
            </div>

            {/* Interest Categories */}
            <div className="space-y-6">
              <h2 className="font-brutalist text-2xl text-foreground tracking-wider border-b border-steel/20 pb-3">
                Interest Categories
              </h2>
              <div className="space-y-4">
                <p className="font-industrial text-muted-foreground">
                  Comma-separated list of interest categories for user subscription preferences
                </p>
                <CMSText
                  page="global"
                  section="subscription_form"
                  contentKey="interest_categories"
                  fallback="Events, Food & Drink, Community News, Special Offers, Workshops"
                  as="div"
                  className="font-industrial text-base text-foreground p-4 border border-steel/20 rounded-lg bg-muted/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionFormEditor;