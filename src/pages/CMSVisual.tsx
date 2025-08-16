import { useParams, useLocation } from 'react-router-dom';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { CMSVisualEditor } from '@/components/cms/CMSVisualEditor';
import { CMSVisualHeader } from '@/components/cms/CMSVisualHeader';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useDraftContent } from '@/hooks/useDraftContent';
import { useEditMode } from '@/contexts/EditModeContext';

const CMSVisual = () => {
  const { page } = useParams<{ page: string }>();
  const location = useLocation();
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Extract the full path after /cms/visual/
  const fullPath = location.pathname.replace('/cms/visual/', '');
  const currentPage = fullPath || page || 'home';
  
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
    <CMSLayout>
      <div className="flex flex-col h-screen">
        <CMSVisualHeader 
          currentPage={page}
          onPublish={handlePublish}
          onViewLive={handleViewLive}
          isPublishing={isPublishing}
          draftCount={draftCount}
        />
        <CMSVisualEditor currentPage={currentPage} />
      </div>
    </CMSLayout>
  );
};

export default CMSVisual;