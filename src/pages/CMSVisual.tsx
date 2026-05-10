import { useParams, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CMSSidebar } from '@/components/cms/CMSSidebar';
import { CMSVisualEditor } from '@/components/cms/CMSVisualEditor';
import { CMSVisualHeader } from '@/components/cms/CMSVisualHeader';
import { CMSErrorBoundary } from '@/components/cms/CMSErrorBoundary';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useDraftContent } from '@/hooks/useDraftContent';
import { useEditMode, EditModeProvider } from '@/contexts/EditModeContext';

interface InnerProps {
  currentPage: string;
  normalizedPage: string;
}

const CMSVisualInner = ({ currentPage, normalizedPage }: InnerProps) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const { draftCount, publishDrafts } = useDraftContent(normalizedPage);
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
    window.open(`/${currentPage}`, '_self');
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex flex-col w-full overflow-x-hidden pt-16">
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
  );
};

const CMSVisual = () => {
  const { page } = useParams<{ page: string }>();
  const location = useLocation();

  const fullPath = location.pathname
    .replace('/management/cms/visual/', '')
    .replace('/cms/visual/', '')
    .replace(/^\/+/, '');
  const currentPage = fullPath || page || 'country';
  const normalizedPage = currentPage.toLowerCase().replace(/^\//, '');

  return (
    <CMSErrorBoundary>
      <EditModeProvider>
        <CMSVisualInner currentPage={currentPage} normalizedPage={normalizedPage} />
      </EditModeProvider>
    </CMSErrorBoundary>
  );
};

export default CMSVisual;
