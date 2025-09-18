import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CMSSidebar } from '@/components/cms/CMSSidebar';
import { CMSVisualHeader } from '@/components/cms/CMSVisualHeader';
import { CMSErrorBoundary } from '@/components/cms/CMSErrorBoundary';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useDraftContent } from '@/hooks/useDraftContent';
import { useEditMode } from '@/contexts/EditModeContext';
import { EditModeProvider } from '@/contexts/EditModeContext';
import { CMSModeProvider } from '@/contexts/CMSModeContext';
import EditableMenuModal from '@/components/cms/EditableMenuModal';
import MenuModal from '@/components/MenuModal';
import { 
  cafeMenuData, 
  cocktailsMenuData, 
  beerMenuData, 
  kitchensMenuData, 
  hallMenuData, 
  communityMenuData 
} from '@/data/menuData';
import { useCMSMenuData } from '@/hooks/useCMSMenuData';

const CMSMenuModal = () => {
  const navigate = useNavigate();
  const location = window.location;
  // Extract page from the current path (e.g., /cms/visual/cafe/menu -> cafe)
  const pathParts = location.pathname.split('/');
  const page = pathParts[pathParts.length - 2]; // Get the part before 'menu'
  
  console.log('CMSMenuModal - Location pathname:', location.pathname);
  console.log('CMSMenuModal - Path parts:', pathParts);
  console.log('CMSMenuModal - Extracted page:', page);

  const handleClose = () => {
    // Navigate back to the parent page (remove /menu from the path)
    navigate(`/cms/visual/${page}`);
  };
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

  // Use CMS data for beer menu, static data for others
  const { data: beerCMSData, loading: beerLoading } = useCMSMenuData('beer', true);
  
  const getMenuData = () => {
    switch (page) {
      case 'cafe':
        return cafeMenuData;
      case 'cocktails':
        return cocktailsMenuData;
      case 'beer':
        return beerCMSData.length > 0 ? beerCMSData : beerMenuData;
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
    <CMSErrorBoundary>
      <EditModeProvider initialEditMode={true}>
        <SidebarProvider defaultOpen={false}>
          <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
            <CMSVisualHeader 
              currentPage={getPageTitle()}
              onPublish={handlePublish}
              onViewLive={handleViewLive}
              isPublishing={isPublishing}
              draftCount={draftCount}
            />
            <div className="flex flex-1 min-h-0">
              <CMSSidebar />
              <main className="flex-1 min-w-0 overflow-auto">
                <div className="flex-1 overflow-hidden bg-muted/20">
                  <CMSModeProvider isCMSMode={true}>
                    <div className="h-full flex items-center justify-center">
                      <div className="w-full h-full relative">
                        <EditableMenuModal
                          isOpen={true}
                          onClose={handleClose}
                          pageType={pageType}
                          menuData={getMenuData()}
                        />
                      </div>
                    </div>
                  </CMSModeProvider>
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </EditModeProvider>
    </CMSErrorBoundary>
  );
};

export default CMSMenuModal;