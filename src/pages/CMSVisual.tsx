import { useParams, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CMSSidebar } from '@/components/cms/CMSSidebar';
import { CMSVisualEditor } from '@/components/cms/CMSVisualEditor';
import { CMSVisualHeader } from '@/components/cms/CMSVisualHeader';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useDraftContent } from '@/hooks/useDraftContent';
import { useEditMode } from '@/contexts/EditModeContext';
import { EditModeProvider } from '@/contexts/EditModeContext';

const CMSVisual = () => {
  const { page } = useParams<{ page: string }>();
  const location = useLocation();
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Extract the full path after /cms/visual/
  const fullPath = location.pathname.replace('/cms/visual/', '');
  const currentPage = fullPath || page || 'home';
  
  console.log('CMSVisual - Location pathname:', location.pathname);
  console.log('CMSVisual - Full path:', fullPath);
  console.log('CMSVisual - Current page:', currentPage);
  console.log('CMSVisual - Page param:', page);
  
  const { draftCount, publishDrafts, refreshDraftCount } = useDraftContent(page || 'home');
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
    const liveUrl = `/${page === 'home' ? '' : page}`;
    window.open(liveUrl, '_blank');
  };

  return (
    <EditModeProvider>
      <SidebarProvider defaultOpen={false}>
        <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
          <CMSVisualHeader 
            currentPage={page}
            onPublish={handlePublish}
            onViewLive={handleViewLive}
            isPublishing={isPublishing}
            draftCount={draftCount}
          />
          <div className="flex flex-1 min-h-0">
            <CMSSidebar />
            <main className="flex-1 min-w-0 overflow-auto">
              <CMSVisualEditor currentPage={currentPage} />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </EditModeProvider>
  );
};

export default CMSVisual;