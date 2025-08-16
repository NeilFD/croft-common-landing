import { useState, useEffect } from 'react';
import { useEditMode } from '@/contexts/EditModeContext';
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
      {/* Visual Editor Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold capitalize">
            {currentPage === 'home' ? 'Home Page' : `${currentPage} Page`}
          </h1>
          
          <div className="flex items-center gap-2">
            <Badge variant={isEditMode ? "default" : "outline"} className="text-xs">
              {isEditMode ? 'Edit Mode' : 'View Mode'}
            </Badge>
            
            {pendingChanges > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pendingChanges} Unsaved Change{pendingChanges > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleEditMode}
            className="gap-2"
          >
            {isEditMode ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            {isEditMode ? 'Preview' : 'Edit'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewLive}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            View Live
          </Button>
          
          <Button 
            size="sm" 
            onClick={handlePublish}
            disabled={pendingChanges === 0 || isPublishing}
            className="gap-2"
          >
            {isPublishing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Page Preview */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className={`transition-all duration-200 ${isEditMode ? 'ring-2 ring-primary/20' : ''}`}>
          <PageComponent />
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