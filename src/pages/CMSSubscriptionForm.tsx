import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useDraftContent } from '@/hooks/useDraftContent';
import { useEditMode } from '@/contexts/EditModeContext';
import { CMSModeProvider } from '@/contexts/CMSModeContext';
import SubscriptionFormEditor from '@/components/cms/SubscriptionFormEditor';

const CMSSubscriptionForm = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/cms');
  };

  const [isPublishing, setIsPublishing] = useState(false);
  const { draftCount, publishDrafts, refreshDraftCount } = useDraftContent('global');
  const { resetPendingChanges } = useEditMode();

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const result = await publishDrafts();
      
      if (result.success) {
        resetPendingChanges();
        toast({
          title: "Changes Published",
          description: "Your subscription form content has been published to the live site.",
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
    window.open('/', '_blank');
  };

  return (
    <div className="flex-1 overflow-hidden bg-muted/20">
      <CMSModeProvider isCMSMode={true}>
        <div className="h-full flex items-center justify-center">
          <div className="w-full h-full relative">
            <SubscriptionFormEditor
              isOpen={true}
              onClose={handleClose}
              onPublish={handlePublish}
              onViewLive={handleViewLive}
              isPublishing={isPublishing}
              draftCount={draftCount}
            />
          </div>
        </div>
      </CMSModeProvider>
    </div>
  );
};

export default CMSSubscriptionForm;