import { useParams } from 'react-router-dom';
import { FAQManager } from '@/components/cms/FAQManager';
import { CMSModeProvider } from '@/contexts/CMSModeContext';

export default function CMSFAQPage() {
  const { page } = useParams<{ page: string }>();
  
  if (!page) {
    return <div className="p-6">Invalid page parameter</div>;
  }

  const pageTitle = page.charAt(0).toUpperCase() + page.slice(1).replace('-', ' ');

  return (
    <CMSModeProvider>
      <div className="min-h-screen bg-background">
        <FAQManager 
          page={page} 
          onPublish={() => {
            // Optionally show success message or refresh data
            console.log('FAQ changes published for', page);
          }}
        />
      </div>
    </CMSModeProvider>
  );
}