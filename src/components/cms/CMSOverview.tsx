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
  Trees,
  Building2,
  Bed,
  Wine,
  UtensilsCrossed,
  PartyPopper,
  Waves,
  ChefHat,
  Clock,
  BookOpen,
  Music,
} from 'lucide-react';
import { CMS_PAGES } from '@/data/cmsPages';
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
        (supabase as any).from('cms_content').select('*', { count: 'exact', head: true }),
        (supabase as any).from('cms_content').select('*', { count: 'exact', head: true }).eq('published', true),
        (supabase as any).from('cms_menu_sections').select('*', { count: 'exact', head: true }),
        (supabase as any).from('cms_menu_items').select('*', { count: 'exact', head: true }),
        (supabase as any).from('cms_images').select('*', { count: 'exact', head: true }),
        (supabase as any).from('cms_brand_assets').select('*', { count: 'exact', head: true })
      ]);

      // Get last updated time
      const { data: lastUpdatedData } = await (supabase as any)
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

  const pages = CMS_PAGES.filter((p) => p.group !== 'Global').map((p) => ({
    name: p.title,
    icon: p.icon,
    path: `/management/cms/visual/${p.slug}`,
    description: p.description,
    group: p.group,
  }));
  const groupedPages = pages.reduce((acc, p) => {
    (acc[p.group] ??= []).push(p);
    return acc;
  }, {} as Record<string, typeof pages>);


  if (loading) {
    return <div className="p-6">Loading overview...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">CMS</h2>
        <p className="text-muted-foreground">
          Edit content for the Crazy Bear sites: Country and Town.
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
        <CardContent className="space-y-6">
          {(['Standalone', 'Country', 'Town'] as const).map((group) => {
            const items = groupedPages[group] ?? [];
            if (items.length === 0) return null;
            return (
              <div key={group}>
                <h3 className="font-display uppercase tracking-wide text-xs text-muted-foreground mb-2">{group}</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {items.map((page) => (
                    <Button
                      key={page.name}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start gap-2 group hover:bg-foreground hover:text-background hover:border-foreground"
                      onClick={() => navigate(page.path)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <page.icon className="h-4 w-4" />
                        <span className="font-medium text-left">{page.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground text-left group-hover:text-background">
                        {page.description}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* System Status */}
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
            onClick={() => {
              // Same-origin preview, use react-router navigation instead
              window.open('/', '_self');
            }}
          >
            <Eye className="h-4 w-4" />
            Preview Live Site
          </Button>
        </CardContent>
      </Card>

      {/* Import/Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Content Management
          </CardTitle>
          <CardDescription>
            Backup and restore your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full justify-start h-auto p-4"
            onClick={() => navigate('/management/cms/import')}
          >
            <div className="flex items-center gap-3 w-full">
              <Download className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Import/Export</div>
                <div className="text-sm text-muted-foreground">
                  Backup and restore content
                </div>
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};