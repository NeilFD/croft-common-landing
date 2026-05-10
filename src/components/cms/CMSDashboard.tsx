import { Routes, Route } from 'react-router-dom';
import { CMSLayout } from './CMSLayout';
import { CMSOverview } from './CMSOverview';
import { GlobalContentManager } from './GlobalContentManager';
import AssetsManager from './AssetsManager';
import BrandManager from './BrandManager';
import ImportManager from './ImportManager';
import { ModalContentManager } from './ModalContentManager';
import { DesignTokenManager } from './DesignTokenManager';
import CMSEmailTemplates from '@/pages/CMSEmailTemplates';
import CMSEmailPreview from '@/pages/CMSEmailPreview';

export default function CMSDashboard() {
  return (
    <CMSLayout>
      <Routes>
        <Route path="" element={<CMSOverview />} />

        {/* Global */}
        <Route path="global/modals" element={<ModalContentManager />} />

        {/* Email Templates */}
        <Route path="email-templates/:template" element={<CMSEmailTemplates />} />
        <Route path="email-templates/:template/preview" element={<CMSEmailPreview />} />

        {/* Assets */}
        <Route path="images" element={<AssetsManager />} />
        <Route path="brand" element={<BrandManager />} />
        <Route path="brand/tokens" element={<DesignTokenManager />} />
        <Route path="import" element={<ImportManager />} />
      </Routes>
    </CMSLayout>
  );
}
