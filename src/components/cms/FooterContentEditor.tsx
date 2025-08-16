import { useRef } from 'react';
import { X, Upload, Eye } from 'lucide-react';
import CroftLogo from '../CroftLogo';
import { CMSText } from './CMSText';
import { useEditMode } from '@/contexts/EditModeContext';
import { Button } from '@/components/ui/button';

interface FooterContentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
  onViewLive: () => void;
  isPublishing: boolean;
  draftCount: number;
}

const FooterContentEditor = ({ 
  isOpen, 
  onClose, 
  onPublish, 
  onViewLive, 
  isPublishing, 
  draftCount 
}: FooterContentEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isEditMode } = useEditMode();

  const handleClose = () => {
    console.log('Footer content editor close button clicked');
    onClose();
  };

  const handleBackdropClick = () => {
    console.log('Footer content editor backdrop clicked');
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
              FOOTER CONTENT EDITOR
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
            {/* Opening Hours Section */}
            <div className="space-y-4">
              <CMSText
                page="global"
                section="footer"
                contentKey="opening_hours_title"
                fallback="Opening Hours"
                as="h2"
                className="font-brutalist text-2xl text-foreground tracking-wider border-b border-steel/20 pb-3"
              />
              <CMSText
                page="global"
                section="footer"
                contentKey="opening_hours_text"
                fallback="Monday - Sunday: 8:00 AM - 11:00 PM\nKitchen closes at 10:00 PM"
                as="div"
                className="font-industrial text-lg text-foreground leading-relaxed whitespace-pre-line"
              />
            </div>

            {/* Contact Section */}
            <div className="space-y-4">
              <CMSText
                page="global"
                section="footer"
                contentKey="contact_title"
                fallback="Contact"
                as="h2"
                className="font-brutalist text-2xl text-foreground tracking-wider border-b border-steel/20 pb-3"
              />
              <div className="space-y-2">
                <CMSText
                  page="global"
                  section="footer"
                  contentKey="contact_address"
                  fallback="117-119 Stokes Croft, Bristol BS1 3RW"
                  as="div"
                  className="font-industrial text-lg text-foreground"
                />
                <CMSText
                  page="global"
                  section="footer"
                  contentKey="contact_phone"
                  fallback="0117 123 4567"
                  as="div"
                  className="font-industrial text-lg text-foreground"
                />
                <CMSText
                  page="global"
                  section="footer"
                  contentKey="contact_email"
                  fallback="hello@croftcommon.com"
                  as="div"
                  className="font-industrial text-lg text-foreground"
                />
              </div>
            </div>

            {/* Legal Section */}
            <div className="space-y-4">
              <CMSText
                page="global"
                section="footer"
                contentKey="legal_text"
                fallback="Privacy Policy | Terms & Conditions"
                as="div"
                className="font-industrial text-base text-muted-foreground"
              />
              <CMSText
                page="global"
                section="footer"
                contentKey="copyright_text"
                fallback="© 2024 Croft Common. All rights reserved."
                as="div"
                className="font-industrial text-sm text-muted-foreground"
              />
            </div>

            {/* Common Good Section */}
            <div className="space-y-4">
              <CMSText
                page="global"
                section="footer"
                contentKey="common_good_title"
                fallback="The Common Good"
                as="h2"
                className="font-brutalist text-2xl text-accent-electric-blue tracking-wider border-b border-steel/20 pb-3"
              />
              <CMSText
                page="global"
                section="footer"
                contentKey="common_good_description"
                fallback="Supporting local causes and community initiatives through shared space and collective action."
                as="div"
                className="font-industrial text-lg text-foreground leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterContentEditor;