import { useParams } from 'react-router-dom';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { CMSVisualHeader } from '@/components/cms/CMSVisualHeader';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useDraftContent } from '@/hooks/useDraftContent';
import { useEditMode } from '@/contexts/EditModeContext';
import { CMSModeProvider } from '@/contexts/CMSModeContext';
import EditableMenuModal from '@/components/cms/EditableMenuModal';
import { 
  cafeMenuData, 
  cocktailsMenuData, 
  beerMenuData, 
  kitchensMenuData, 
  hallMenuData, 
  communityMenuData 
} from '@/data/menuData';

const CMSMenuModal = () => {
  const { page } = useParams<{ page: string }>();
  const [isPublishing, setIsPublishing] = useState(false);
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
          description: "Your menu content has been published to the live site.",
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

  const getMenuData = () => {
    switch (page) {
      case 'cafe':
        return cafeMenuData;
      case 'cocktails':
        return cocktailsMenuData;
      case 'beer':
        return beerMenuData;
      case 'kitchens':
        return kitchensMenuData;
      case 'hall':
        return hallMenuData;
      case 'community':
        return communityMenuData;
      default:
        return [];
    }
  };

  const getPageTitle = () => {
    switch (page) {
      case 'cafe':
        return 'Cafe Menu';
      case 'cocktails':
        return 'Cocktails Menu';
      case 'beer':
        return 'Beer Menu';
      case 'kitchens':
        return 'Kitchens Menu';
      case 'hall':
        return 'Hall Description';
      case 'community':
        return 'Community Description';
      default:
        return 'Menu';
    }
  };

  const pageType = page as 'cafe' | 'cocktails' | 'beer' | 'kitchens' | 'hall' | 'community' | 'common-room';

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
        <div className="flex-1 overflow-hidden bg-muted/20">
          <CMSModeProvider isCMSMode={true}>
            <div className="h-full flex items-center justify-center">
              <div className="w-full h-full relative">
                <EditableMenuModal
                  isOpen={true}
                  onClose={() => {}} // No-op in CMS mode
                  pageType={pageType}
                  menuData={getMenuData()}
                />
              </div>
            </div>
          </CMSModeProvider>
        </div>
      </div>
    </CMSLayout>
  );
};

export default CMSMenuModal;