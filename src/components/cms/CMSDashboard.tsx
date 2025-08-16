import { Routes, Route } from 'react-router-dom';
import ContentManager from './ContentManager';
import ImageManager from './ImageManager';
import BrandManager from './BrandManager';
import ImportManager from './ImportManager';

export default function CMSDashboard() {
  return (
    <div className="min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Content Management System</h1>
        <p className="text-muted-foreground">
          Manage your website content, images, and branding from one central location.
        </p>
      </div>

      <Routes>
        {/* Simplified routes for testing */}
        <Route path="/" element={
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">CMS Overview</h2>
            <p>Welcome to the Content Management System. Use the navigation to manage your content.</p>
          </div>
        } />
        
        <Route path="/content" element={<ContentManager />} />
        <Route path="/images" element={<ImageManager />} />
        <Route path="/brand" element={<BrandManager />} />
        <Route path="/import" element={<ImportManager />} />
      </Routes>
    </div>
  );
}