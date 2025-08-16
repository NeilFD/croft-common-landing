import { useParams } from 'react-router-dom';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { CMSVisualEditor } from '@/components/cms/CMSVisualEditor';
import { CMSVisualHeader } from '@/components/cms/CMSVisualHeader';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const CMSVisual = () => {
  const { page } = useParams<{ page: string }>();
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // Simulate publishing process
      await new Promise(resolve => setTimeout(resolve, 1000));
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
        />
        <CMSVisualEditor currentPage={page || 'home'} />
      </div>
    </CMSLayout>
  );
};

export default CMSVisual;