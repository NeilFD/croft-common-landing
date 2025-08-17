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
  draftCount?: number;
}

export const CMSVisualHeader = ({ 
  currentPage, 
  onPublish, 
  onViewLive, 
  isPublishing,
  draftCount = 0
}: CMSVisualHeaderProps) => {
  const { 
    isEditMode, 
    toggleEditMode, 
    pendingChanges 
  } = useEditMode();

  return (
    <header className="flex items-center justify-between h-16 px-3 sm:px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-50">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <SidebarTrigger className="p-2 hover:bg-accent rounded-md border border-border bg-background shadow-sm flex-shrink-0" />
        <CroftLogo size="lg" className="hidden sm:block ml-2" priority />
        <div className="hidden lg:flex flex-col">
          <h2 className="text-lg font-bold tracking-wide text-foreground">CROFT COMMON</h2>
        </div>
        <div className="hidden lg:block border-l border-border h-8 mx-2" />
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-semibold truncate">
            Visual Editor{currentPage && (
              <span className="hidden sm:inline"> - {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}</span>
            )}
          </h1>
          <p className="hidden sm:block text-sm text-muted-foreground">Edit your content in real-time</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
        <Badge variant={isEditMode ? "default" : "outline"} className="hidden sm:inline-flex text-xs">
          {isEditMode ? 'Edit Mode' : 'View Mode'}
        </Badge>
        
        {pendingChanges > 0 && (
          <Badge variant="secondary" className="text-xs">
            <span className="sm:hidden">{pendingChanges}</span>
            <span className="hidden sm:inline">{pendingChanges} Unsaved</span>
          </Badge>
        )}
        
        {draftCount > 0 && (
          <Badge variant="outline" className="text-xs">
            <span className="sm:hidden">{draftCount}</span>
            <span className="hidden sm:inline">{draftCount} Draft{draftCount !== 1 ? 's' : ''}</span>
          </Badge>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleEditMode}
          className="gap-1 sm:gap-2"
        >
          {isEditMode ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
          <span className="hidden md:inline">{isEditMode ? 'Preview' : 'Edit'}</span>
        </Button>
        
        {onViewLive && (
          <Button variant="outline" size="sm" className="gap-1 sm:gap-2" onClick={onViewLive}>
            <Globe className="h-4 w-4" />
            <span className="hidden lg:inline">View Live</span>
          </Button>
        )}
        
        {onPublish && (
          <Button 
            size="sm" 
            className="gap-1 sm:gap-2"
            onClick={onPublish}
            disabled={(pendingChanges === 0 && draftCount === 0) || isPublishing}
          >
            {isPublishing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {isPublishing ? 'Publishing...' : draftCount > 0 ? 'Publish Drafts' : 'Publish'}
            </span>
          </Button>
        )}
      </div>
    </header>
  );
};