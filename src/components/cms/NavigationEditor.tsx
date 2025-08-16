import { useRef } from 'react';
import { X, Upload, Eye } from 'lucide-react';
import CroftLogo from '../CroftLogo';
import { CMSText } from './CMSText';
import { useEditMode } from '@/contexts/EditModeContext';
import { Button } from '@/components/ui/button';

interface NavigationEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
  onViewLive: () => void;
  isPublishing: boolean;
  draftCount: number;
}

const NavigationEditor = ({ 
  isOpen, 
  onClose, 
  onPublish, 
  onViewLive, 
  isPublishing, 
  draftCount 
}: NavigationEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isEditMode } = useEditMode();

  const handleClose = () => {
    console.log('Navigation editor close button clicked');
    onClose();
  };

  const handleBackdropClick = () => {
    console.log('Navigation editor backdrop clicked');
    onClose();
  };

  if (!isOpen) return null;

  const navigationItems = [
    { key: 'nav_home', label: 'HOME', fallback: 'HOME' },
    { key: 'nav_cafe', label: 'CAFÉ', fallback: 'CAFÉ' },
    { key: 'nav_cocktails', label: 'COCKTAILS', fallback: 'COCKTAILS' },
    { key: 'nav_beer', label: 'BEER', fallback: 'BEER' },
    { key: 'nav_kitchens', label: 'KITCHENS', fallback: 'KITCHENS' },
    { key: 'nav_hall', label: 'HALL', fallback: 'HALL' },
    { key: 'nav_community', label: 'COMMUNITY', fallback: 'COMMUNITY' },
    { key: 'nav_common_room', label: 'COMMON ROOM', fallback: 'COMMON ROOM' }
  ];

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
              NAVIGATION EDITOR
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
            <div className="text-center space-y-4 mb-10">
              <h2 className="font-brutalist text-2xl text-foreground tracking-wider">
                Main Navigation Labels
              </h2>
              <p className="font-industrial text-muted-foreground">
                Edit the display text for each navigation menu item
              </p>
            </div>

            {/* Navigation Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {navigationItems.map((item) => (
                <div key={item.key} className="space-y-3 p-4 border border-steel/20 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {item.label}
                  </div>
                  <CMSText
                    page="global"
                    section="navigation"
                    contentKey={item.key}
                    fallback={item.fallback}
                    as="div"
                    className="font-brutalist text-xl text-foreground tracking-wider border-b border-steel/10 pb-2"
                  />
                </div>
              ))}
            </div>

            {/* Additional Navigation Options */}
            <div className="space-y-6 mt-10 pt-10 border-t border-steel/20">
              <h3 className="font-brutalist text-xl text-foreground tracking-wider">
                Additional Navigation
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 border border-steel/20 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Book Button Label
                  </div>
                  <CMSText
                    page="global"
                    section="navigation"
                    contentKey="nav_book"
                    fallback="BOOK"
                    as="div"
                    className="font-brutalist text-xl text-accent-electric-blue tracking-wider"
                  />
                </div>

                <div className="p-4 border border-steel/20 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Open Button Label
                  </div>
                  <CMSText
                    page="global"
                    section="navigation"
                    contentKey="nav_open"
                    fallback="OPEN"
                    as="div"
                    className="font-brutalist text-xl text-accent-electric-blue tracking-wider"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationEditor;