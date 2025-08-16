import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Image, 
  Palette, 
  Download, 
  Eye, 
  Settings,
  Coffee,
  Wine,
  Beer,
  ChefHat,
  Calendar,
  Users,
  Building2,
  Home,
  Globe,
  MessageSquare
} from 'lucide-react';
import ContentManager from './ContentManager';
import { MenuManager } from './MenuManager';
import { GlobalContentManager } from './GlobalContentManager';
import ImageManager from './ImageManager';
import BrandManager from './BrandManager';
import ImportManager from './ImportManager';

export default function CMSDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const location = useLocation();

  // Get current path to determine active tab
  const currentPath = location.pathname;
  const isOverview = currentPath === '/cms' || currentPath === '/cms/';

  const pages = [
    { name: 'Home', path: 'home', icon: Home },
    { name: 'Cafe', path: 'cafe', icon: Coffee },
    { name: 'Cocktails', path: 'cocktails', icon: Wine },
    { name: 'Beer', path: 'beer', icon: Beer },
    { name: 'Kitchens', path: 'kitchens', icon: ChefHat },
    { name: 'Hall', path: 'hall', icon: Calendar },
    { name: 'Community', path: 'community', icon: Users },
    { name: 'Common Room', path: 'common-room', icon: Building2 }
  ];

  const globalSections = [
    { name: 'Footer Content', key: 'footer' },
    { name: 'Navigation', key: 'navigation' },
    { name: 'Subscription Form', key: 'subscription_form' },
    { name: 'Modal Content', key: 'modals' }
  ];

  if (isOverview) {
    return (
      <div className="min-h-screen p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Content Management System</h1>
          <p className="text-muted-foreground">
            Manage your website content, images, and branding from one central location.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="brand">Brand</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pages</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pages.length}</div>
                  <p className="text-xs text-muted-foreground">Content pages</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Global Content</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{globalSections.length}</div>
                  <p className="text-xs text-muted-foreground">Global sections</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Images</CardTitle>
                  <Image className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">37+</div>
                  <p className="text-xs text-muted-foreground">Media assets</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Brand Assets</CardTitle>
                  <Palette className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-muted-foreground">Design tokens</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common management tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('pages')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Manage Page Content
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('images')}>
                    <Image className="mr-2 h-4 w-4" />
                    Upload Images
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('brand')}>
                    <Palette className="mr-2 h-4 w-4" />
                    Update Branding
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('global')}>
                    <Globe className="mr-2 h-4 w-4" />
                    Global Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Current system information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Website Status</span>
                    <span className="text-sm text-green-600 font-medium">Live</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <span className="text-sm text-green-600 font-medium">Connected</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => window.open('/', '_blank')}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Live Site
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Page Management</h2>
              <p className="text-muted-foreground">Manage content and menus for each page</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {pages.map((page) => (
                <Card key={page.path} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <page.icon className="h-5 w-5" />
                      {page.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate(`/cms/content?page=${page.path}`)}
                    >
                      Edit Content
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate(`/cms/menu?page=${page.path}`)}
                    >
                      Manage Menu
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="global" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Global Content</h2>
              <p className="text-muted-foreground">Manage site-wide content like footer, navigation, and forms</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {globalSections.map((section) => (
                <Card key={section.key} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{section.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/cms/global?type=${section.key}`)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Manage {section.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="images">
            <ImageManager />
          </TabsContent>

          <TabsContent value="brand">
            <BrandManager />
          </TabsContent>

          <TabsContent value="import">
            <ImportManager />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Handle sub-routes
  return (
    <div className="min-h-screen p-6">
      <Routes>
        <Route path="/content" element={
          <ContentManager 
            page={new URLSearchParams(location.search).get('page') || undefined}
            pageTitle={pages.find(p => p.path === new URLSearchParams(location.search).get('page'))?.name}
          />
        } />
        <Route path="/menu" element={
          <MenuManager 
            page={new URLSearchParams(location.search).get('page') || 'home'}
            pageTitle={pages.find(p => p.path === new URLSearchParams(location.search).get('page'))?.name || 'Home'}
          />
        } />
        <Route path="/global" element={
          <GlobalContentManager 
            contentType={new URLSearchParams(location.search).get('type') as any || 'footer'}
          />
        } />
        <Route path="/images" element={<ImageManager />} />
        <Route path="/brand" element={<BrandManager />} />
        <Route path="/import" element={<ImportManager />} />
      </Routes>
    </div>
  );
}