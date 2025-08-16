import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  TrendingUp,
  Clock
} from 'lucide-react';

interface OverviewStats {
  totalContent: number;
  totalMenuSections: number;
  totalMenuItems: number;
  totalImages: number;
  totalBrandAssets: number;
  publishedContent: number;
  lastUpdated: string;
}

export const CMSOverview = () => {
  const [stats, setStats] = useState<OverviewStats>({
    totalContent: 0,
    totalMenuSections: 0,
    totalMenuItems: 0,
    totalImages: 0,
    totalBrandAssets: 0,
    publishedContent: 0,
    lastUpdated: 'Never'
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch content stats
      const [
        { count: contentCount },
        { count: publishedCount },
        { count: menuSectionsCount },
        { count: menuItemsCount },
        { count: imagesCount },
        { count: brandAssetsCount }
      ] = await Promise.all([
        supabase.from('cms_content').select('*', { count: 'exact', head: true }),
        supabase.from('cms_content').select('*', { count: 'exact', head: true }).eq('published', true),
        supabase.from('cms_menu_sections').select('*', { count: 'exact', head: true }),
        supabase.from('cms_menu_items').select('*', { count: 'exact', head: true }),
        supabase.from('cms_images').select('*', { count: 'exact', head: true }),
        supabase.from('cms_brand_assets').select('*', { count: 'exact', head: true })
      ]);

      // Get last updated time
      const { data: lastUpdatedData } = await supabase
        .from('cms_content')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      setStats({
        totalContent: contentCount || 0,
        totalMenuSections: menuSectionsCount || 0,
        totalMenuItems: menuItemsCount || 0,
        totalImages: imagesCount || 0,
        totalBrandAssets: brandAssetsCount || 0,
        publishedContent: publishedCount || 0,
        lastUpdated: lastUpdatedData?.updated_at 
          ? new Date(lastUpdatedData.updated_at).toLocaleString()
          : 'Never'
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const pages = [
    { name: 'Home', icon: Home, path: '/cms/pages/home/content', description: 'Main landing page content' },
    { name: 'Cafe', icon: Coffee, path: '/cms/pages/cafe/content', description: 'Coffee and food menu' },
    { name: 'Cocktails', icon: Wine, path: '/cms/pages/cocktails/content', description: 'Cocktail menu and specials' },
    { name: 'Beer', icon: Beer, path: '/cms/pages/beer/content', description: 'Beer selection and information' },
    { name: 'Kitchens', icon: ChefHat, path: '/cms/pages/kitchens/content', description: 'Full kitchen menu' },
    { name: 'Hall', icon: Calendar, path: '/cms/pages/hall/content', description: 'Event space information' },
    { name: 'Community', icon: Users, path: '/cms/pages/community/content', description: 'Community information' },
    { name: 'Common Room', icon: Building2, path: '/cms/pages/common-room/content', description: 'Membership space details' }
  ];

  const quickActions = [
    { name: 'Edit Page Content', icon: FileText, path: '/cms/pages/home/content', description: 'Update text and copy' },
    { name: 'Manage Menus', icon: ChefHat, path: '/cms/pages/cafe/menu', description: 'Edit menu items and pricing' },
    { name: 'Upload Images', icon: Image, path: '/cms/images', description: 'Add new photos and media' },
    { name: 'Update Branding', icon: Palette, path: '/cms/brand', description: 'Modify colors and assets' },
    { name: 'Global Settings', icon: Settings, path: '/cms/global/footer', description: 'Footer and navigation' },
    { name: 'Import/Export', icon: Download, path: '/cms/import', description: 'Backup and restore content' }
  ];

  if (loading) {
    return <div className="p-6">Loading overview...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">CMS Overview</h2>
        <p className="text-muted-foreground">
          Comprehensive content management for your website
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Items</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContent}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedContent} published
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMenuItems}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalMenuSections} sections
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Assets</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalImages}</div>
            <p className="text-xs text-muted-foreground">Images and media</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brand Assets</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBrandAssets}</div>
            <p className="text-xs text-muted-foreground">Design tokens</p>
          </CardContent>
        </Card>
      </div>

      {/* Page Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Page Management
          </CardTitle>
          <CardDescription>
            Manage content for each page of your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {pages.map((page) => (
              <Button
                key={page.name}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={() => navigate(page.path)}
              >
                <div className="flex items-center gap-2 w-full">
                  <page.icon className="h-4 w-4" />
                  <span className="font-medium">{page.name}</span>
                </div>
                <span className="text-xs text-muted-foreground text-left">
                  {page.description}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks to manage your content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <Button
                key={action.name}
                variant="ghost"
                className="w-full justify-start h-auto p-3"
                onClick={() => navigate(action.path)}
              >
                <div className="flex items-center gap-3 w-full">
                  <action.icon className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">{action.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>
              Current status and recent activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Website Status</span>
              <Badge className="bg-green-100 text-green-800">Live</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Content Status</span>
              <Badge variant="outline">
                {stats.publishedContent}/{stats.totalContent} Published
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Last Updated</span>
              <span className="text-xs text-muted-foreground">
                {stats.lastUpdated !== 'Never' 
                  ? new Date(stats.lastUpdated).toLocaleDateString()
                  : 'Never'
                }
              </span>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full gap-2"
              onClick={() => window.open('/', '_blank')}
            >
              <Eye className="h-4 w-4" />
              Preview Live Site
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};