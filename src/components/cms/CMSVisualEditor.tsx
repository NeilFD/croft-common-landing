import { useState, useEffect } from 'react';
import { useEditMode } from '@/contexts/EditModeContext';
import { CMSModeProvider } from '@/contexts/CMSModeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Globe, Save, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Import all page components
import Cafe from '@/pages/Cafe';
import Cocktails from '@/pages/Cocktails';
import Beer from '@/pages/Beer';
import Kitchens from '@/pages/Kitchens';
import Hall from '@/pages/Hall';
import Community from '@/pages/Community';
import CommonRoom from '@/pages/CommonRoom';
import Index from '@/pages/Index';

interface CMSVisualEditorProps {
  currentPage: string;
}

const pageComponents: Record<string, React.ComponentType> = {
  'home': Index,
  'cafe': Cafe,
  'cocktails': Cocktails,
  'beer': Beer,
  'kitchens': Kitchens,
  'hall': Hall,
  'community': Community,
  'common-room': CommonRoom,
};

export const CMSVisualEditor = ({ currentPage }: CMSVisualEditorProps) => {
  const { 
    isEditMode, 
    toggleEditMode, 
    isPreviewMode, 
    togglePreviewMode,
    pendingChanges,
    resetPendingChanges 
  } = useEditMode();
  
  const [isPublishing, setIsPublishing] = useState(false);

  const PageComponent = pageComponents[currentPage];

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // Simulate publishing process
      await new Promise(resolve => setTimeout(resolve, 1000));
      resetPendingChanges();
      toast({
        title: "Changes Published",
        description: "Your content has been published to the live site.",
      });
    } catch (error) {
      toast({
        title: "Publishing Failed",
        description: "There was an error publishing your changes.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleViewLive = () => {
    const liveUrl = `/${currentPage === 'home' ? '' : currentPage}`;
    window.open(liveUrl, '_blank');
  };

  if (!PageComponent) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page "{currentPage}" is not available for visual editing yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Page Preview */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className={`transition-all duration-200 ${isEditMode ? 'ring-2 ring-primary/20' : ''}`}>
          <CMSModeProvider isCMSMode={true}>
            <PageComponent />
          </CMSModeProvider>
        </div>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="fixed bottom-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          Click text to edit
        </div>
      )}
    </div>
  );
};