import { useParams, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CMSSidebar } from '@/components/cms/CMSSidebar';
import { CMSVisualEditor } from '@/components/cms/CMSVisualEditor';
import { CMSVisualHeader } from '@/components/cms/CMSVisualHeader';
import { CMSErrorBoundary } from '@/components/cms/CMSErrorBoundary';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useDraftContent } from '@/hooks/useDraftContent';
import { useEditMode } from '@/contexts/EditModeContext';
import { EditModeProvider } from '@/contexts/EditModeContext';

const CMSVisual = () => {
  const { page } = useParams<{ page: string }>();
  const location = useLocation();
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Extract the full path after /management/cms/visual/ (or legacy /cms/visual/)
  const fullPath = location.pathname
    .replace('/management/cms/visual/', '')
    .replace('/cms/visual/', '')
    .replace(/^\/+/, '');
  const currentPage = fullPath || page || 'country';

  // Normalize page name for consistent mapping
  const normalizedPage = currentPage.toLowerCase().replace(/^\//, '');
  
  
  const { draftCount, publishDrafts, refreshDraftCount } = useDraftContent(normalizedPage);
  
  // Add specific debugging for notifications page
  if (normalizedPage === 'notifications') {
    console.log('🔔 NOTIFICATIONS PAGE: Draft count:', draftCount);
    console.log('🔔 NOTIFICATIONS PAGE: Publishing state:', isPublishing);
  }
  const { resetPendingChanges } = useEditMode();

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const result = await publishDrafts();
      
      if (result.success) {
        resetPendingChanges();
        toast({
          title: "Changes Published",
          description: "Your content has been published to the live site.",
        });
      } else {
        throw new Error('Failed to publish drafts');
      }
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
    const liveUrl = `/${currentPage}`;
    window.open(liveUrl, '_self');
  };

  return (
    <CMSErrorBoundary>
      <EditModeProvider>
        <SidebarProvider defaultOpen={false}>
          <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
            <CMSVisualHeader 
              currentPage={currentPage}
              onPublish={handlePublish}
              onViewLive={handleViewLive}
              isPublishing={isPublishing}
              draftCount={draftCount}
            />
            <div className="flex flex-1 min-h-0">
              <CMSSidebar />
              <main className="flex-1 min-w-0 overflow-auto">
                <CMSVisualEditor currentPage={normalizedPage} />
              </main>
            </div>
          </div>
        </SidebarProvider>
      </EditModeProvider>
    </CMSErrorBoundary>
  );
};

export default CMSVisual;