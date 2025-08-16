import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Eye, RefreshCw, Edit, Globe } from 'lucide-react';
import CroftLogo from '@/components/CroftLogo';
import { useEditMode } from '@/contexts/EditModeContext';

interface CMSVisualHeaderProps {
  currentPage?: string;
  onPublish?: () => void;
  onViewLive?: () => void;
  isPublishing?: boolean;
}

export const CMSVisualHeader = ({ 
  currentPage, 
  onPublish, 
  onViewLive, 
  isPublishing 
}: CMSVisualHeaderProps) => {
  const { 
    isEditMode, 
    toggleEditMode, 
    pendingChanges 
  } = useEditMode();

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="p-2 hover:bg-accent rounded-md border border-border bg-background shadow-sm" />
        <CroftLogo size="lg" className="ml-2" priority />
        <div className="flex flex-col">
          <h2 className="text-lg font-bold tracking-wide text-foreground">CROFT COMMON</h2>
        </div>
        <div className="border-l border-border h-8 mx-2" />
        <div>
          <h1 className="text-xl font-semibold">
            Visual Editor - {currentPage ? currentPage.charAt(0).toUpperCase() + currentPage.slice(1) : 'CMS'}
          </h1>
          <p className="text-sm text-muted-foreground">Edit your content in real-time</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Badge variant={isEditMode ? "default" : "outline"} className="text-xs">
          {isEditMode ? 'Edit Mode' : 'View Mode'}
        </Badge>
        
        {pendingChanges > 0 && (
          <Badge variant="secondary" className="text-xs">
            {pendingChanges} Unsaved
          </Badge>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleEditMode}
          className="gap-2"
        >
          {isEditMode ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
          {isEditMode ? 'Preview' : 'Edit'}
        </Button>
        
        {onViewLive && (
          <Button variant="outline" size="sm" className="gap-2" onClick={onViewLive}>
            <Globe className="h-4 w-4" />
            View Live
          </Button>
        )}
        
        {onPublish && (
          <Button 
            size="sm" 
            className="gap-2"
            onClick={onPublish}
            disabled={pendingChanges === 0 || isPublishing}
          >
            {isPublishing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Button>
        )}
      </div>
    </header>
  );
};