import { useParams } from 'react-router-dom';
import { EmailTemplateManager } from '@/components/cms/EmailTemplateManager';

export default function CMSEmailTemplates() {
  const { template } = useParams<{ template: string }>();
  
  const validTemplates = ['welcome', 'cinema', 'event'];
  const templateType = validTemplates.includes(template || '') 
    ? (template as 'welcome' | 'cinema' | 'event')
    : 'welcome';

  return <EmailTemplateManager templateType={templateType} />;
}