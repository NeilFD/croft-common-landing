import { Routes, Route } from 'react-router-dom';
import { CMSLayout } from './CMSLayout';
import { CMSOverview } from './CMSOverview';
import ContentManager from './ContentManager';
import { MenuManager } from './MenuManager';
import { GlobalContentManager } from './GlobalContentManager';
import ImageManager from './ImageManager';
import BrandManager from './BrandManager';
import ImportManager from './ImportManager';

export default function CMSDashboard() {
  return (
    <CMSLayout>
      <Routes>
        {/* Overview */}
        <Route path="/" element={<CMSOverview />} />
        
        {/* Page Content Routes */}
        <Route path="/pages/home/content" element={<ContentManager page="home" pageTitle="Home" />} />
        <Route path="/pages/home/menu" element={<MenuManager page="home" pageTitle="Home" />} />
        
        <Route path="/pages/cafe/content" element={<ContentManager page="cafe" pageTitle="Cafe" />} />
        <Route path="/pages/cafe/menu" element={<MenuManager page="cafe" pageTitle="Cafe" />} />
        
        <Route path="/pages/cocktails/content" element={<ContentManager page="cocktails" pageTitle="Cocktails" />} />
        <Route path="/pages/cocktails/menu" element={<MenuManager page="cocktails" pageTitle="Cocktails" />} />
        <Route path="/pages/cocktails/secret" element={<ContentManager page="cocktails" pageTitle="Cocktails - Secret Content" section="secret" />} />
        
        <Route path="/pages/beer/content" element={<ContentManager page="beer" pageTitle="Beer" />} />
        <Route path="/pages/beer/menu" element={<MenuManager page="beer" pageTitle="Beer" />} />
        <Route path="/pages/beer/secret" element={<ContentManager page="beer" pageTitle="Beer - Secret Content" section="secret" />} />
        
        <Route path="/pages/kitchens/content" element={<ContentManager page="kitchens" pageTitle="Kitchens" />} />
        <Route path="/pages/kitchens/menu" element={<MenuManager page="kitchens" pageTitle="Kitchens" />} />
        <Route path="/pages/kitchens/secret" element={<ContentManager page="kitchens" pageTitle="Kitchens - Secret Content" section="secret" />} />
        
        <Route path="/pages/hall/content" element={<ContentManager page="hall" pageTitle="Hall" />} />
        <Route path="/pages/hall/menu" element={<MenuManager page="hall" pageTitle="Hall" />} />
        
        <Route path="/pages/community/content" element={<ContentManager page="community" pageTitle="Community" />} />
        <Route path="/pages/community/menu" element={<MenuManager page="community" pageTitle="Community" />} />
        
        <Route path="/pages/common-room/content" element={<ContentManager page="common-room" pageTitle="Common Room" />} />
        <Route path="/pages/common-room/menu" element={<MenuManager page="common-room" pageTitle="Common Room" />} />
        
        {/* Global Content Routes */}
        <Route path="/global/footer" element={<GlobalContentManager contentType="footer" />} />
        <Route path="/global/navigation" element={<GlobalContentManager contentType="navigation" />} />
        <Route path="/global/subscription" element={<GlobalContentManager contentType="subscription_form" />} />
        <Route path="/global/modals" element={<GlobalContentManager contentType="modals" />} />
        
        {/* Management Routes */}
        <Route path="/images" element={<ImageManager />} />
        <Route path="/brand" element={<BrandManager />} />
        <Route path="/import" element={<ImportManager />} />
      </Routes>
    </CMSLayout>
  );
}