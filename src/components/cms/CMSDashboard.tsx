import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Image, Palette, Upload, Settings } from 'lucide-react';
import ContentManager from './ContentManager';
import ImageManager from './ImageManager';
import BrandManager from './BrandManager';
import ImportManager from './ImportManager';

const CMSDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="font-brutalist text-4xl mb-2">Content Management System</h1>
        <p className="font-industrial text-muted-foreground">
          Manage all your site content, images, and branding from one place
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Images
          </TabsTrigger>
          <TabsTrigger value="brand" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Brand
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pages</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">
                  Content pages managed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Images</CardTitle>
                <Image className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">37+</div>
                <p className="text-xs text-muted-foreground">
                  Hero carousel images
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Brand Assets</CardTitle>
                <Palette className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  Logos and fonts
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Design Tokens</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">20+</div>
                <p className="text-xs text-muted-foreground">
                  Colors and styles
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => setActiveTab('import')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import Current Content
                </Button>
                <Button 
                  onClick={() => setActiveTab('content')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Edit Page Content
                </Button>
                <Button 
                  onClick={() => setActiveTab('images')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Image className="mr-2 h-4 w-4" />
                  Manage Images
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No recent activity. Start by importing your current content.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <ContentManager />
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
};

export default CMSDashboard;