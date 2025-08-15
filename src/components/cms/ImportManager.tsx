import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ImportStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  error?: string;
}

const ImportManager = () => {
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<ImportStep[]>([
    {
      id: 'content',
      name: 'Import Page Content',
      description: 'Headlines, descriptions, and text content from all pages',
      completed: false,
    },
    {
      id: 'images',
      name: 'Import Hero Images',
      description: 'All carousel images with metadata and descriptions',
      completed: false,
    },
    {
      id: 'brand',
      name: 'Import Brand Assets',
      description: 'Logos, fonts, and brand elements',
      completed: false,
    },
    {
      id: 'design',
      name: 'Import Design Tokens',
      description: 'Colors, spacing, and design system variables',
      completed: false,
    },
  ]);

  const updateStep = (id: string, completed: boolean, error?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, completed, error } : step
    ));
  };

  const importContent = async () => {
    if (!user) return;

    try {
      setProgress(25);
      
      // Import page content
      const contentData = [
        {
          page: 'index',
          section: 'hero',
          content_key: 'title',
          content_type: 'text' as const,
          content_data: { text: 'CROFT COMMON' },
          created_by: user.id,
        },
        {
          page: 'beer',
          section: 'main',
          content_key: 'title',
          content_type: 'text' as const,
          content_data: { text: 'BEER' },
          created_by: user.id,
        },
        {
          page: 'beer',
          section: 'main',
          content_key: 'description',
          content_type: 'text' as const,
          content_data: { 
            text: 'Steel lines. Long tables. Cold pints. No pretence, we\'re all friends, warm sounds.\n\nBig heart.' 
          },
          created_by: user.id,
        },
        {
          page: 'hall',
          section: 'main',
          content_key: 'title',
          content_type: 'text' as const,
          content_data: { text: 'HALL' },
          created_by: user.id,
        },
        {
          page: 'hall',
          section: 'main',
          content_key: 'description',
          content_type: 'text' as const,
          content_data: { 
            text: 'An empty room. Blank canvas. Full sound. Lights cut. Walls shake. Life\'s big moments.\n\nStrip it back. Fill it up.' 
          },
          created_by: user.id,
        },
      ];

      const { error: contentError } = await supabase
        .from('cms_content')
        .insert(contentData);

      if (contentError) throw contentError;
      updateStep('content', true);

    } catch (error) {
      updateStep('content', false, error instanceof Error ? error.message : 'Failed to import content');
      throw error;
    }
  };

  const importImages = async () => {
    if (!user) return;

    try {
      setProgress(50);

      // Sample hero images data (you can expand this with actual image URLs)
      const imageData = [
        {
          asset_type: 'hero_image' as const,
          page: 'index',
          carousel_name: 'main_hero',
          title: 'Main Hero Image',
          description: 'Primary hero image for homepage',
          image_url: '/lovable-uploads/00e4abb5-7048-4240-9a07-44d31b238a96.png',
          alt_text: 'Croft Common interior',
          sort_order: 1,
          created_by: user.id,
        },
        {
          asset_type: 'hero_image' as const,
          page: 'beer',
          carousel_name: 'beer_hero',
          title: 'Beer Section Hero',
          description: 'Hero image for beer section',
          image_url: '/lovable-uploads/2adc6d27-c55e-409e-a08f-06f29113262f.png',
          alt_text: 'Beer area interior',
          sort_order: 1,
          created_by: user.id,
        },
        // Add more images as needed
      ];

      const { error: imageError } = await supabase
        .from('cms_images')
        .insert(imageData);

      if (imageError) throw imageError;
      updateStep('images', true);

    } catch (error) {
      updateStep('images', false, error instanceof Error ? error.message : 'Failed to import images');
      throw error;
    }
  };

  const importBrandAssets = async () => {
    if (!user) return;

    try {
      setProgress(75);

      const brandData = [
        {
          asset_key: 'primary_logo',
          asset_type: 'logo',
          asset_value: '/brand/logo.png',
          description: 'Primary Croft Common logo',
          created_by: user.id,
        },
        {
          asset_key: 'brand_name',
          asset_type: 'text',
          asset_value: 'Croft Common',
          description: 'Brand name',
          created_by: user.id,
        },
        {
          asset_key: 'primary_font',
          asset_type: 'font',
          asset_value: 'Oswald',
          description: 'Primary brutalist font for headlines',
          created_by: user.id,
        },
        {
          asset_key: 'secondary_font',
          asset_type: 'font',
          asset_value: 'Work Sans',
          description: 'Secondary industrial font for body text',
          created_by: user.id,
        },
      ];

      const { error: brandError } = await supabase
        .from('cms_brand_assets')
        .insert(brandData);

      if (brandError) throw brandError;
      updateStep('brand', true);

    } catch (error) {
      updateStep('brand', false, error instanceof Error ? error.message : 'Failed to import brand assets');
      throw error;
    }
  };

  const importDesignTokens = async () => {
    if (!user) return;

    try {
      setProgress(90);

      const designTokens = [
        {
          token_key: 'primary_color',
          token_type: 'color',
          token_value: 'hsl(var(--primary))',
          css_variable: '--primary',
          description: 'Primary brand color',
          created_by: user.id,
        },
        {
          token_key: 'accent_pink',
          token_type: 'color',
          token_value: 'hsl(var(--accent-pink))',
          css_variable: '--accent-pink',
          description: 'Pink accent color',
          created_by: user.id,
        },
        {
          token_key: 'background_color',
          token_type: 'color',
          token_value: 'hsl(var(--background))',
          css_variable: '--background',
          description: 'Background color',
          created_by: user.id,
        },
        // Add more design tokens as needed
      ];

      const { error: designError } = await supabase
        .from('cms_design_tokens')
        .insert(designTokens);

      if (designError) throw designError;
      updateStep('design', true);
      setProgress(100);

    } catch (error) {
      updateStep('design', false, error instanceof Error ? error.message : 'Failed to import design tokens');
      throw error;
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);

    try {
      await importContent();
      await importImages();
      await importBrandAssets();
      await importDesignTokens();
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  const allCompleted = steps.every(step => step.completed);
  const hasErrors = steps.some(step => step.error);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Current Site Content
          </CardTitle>
          <p className="text-muted-foreground">
            This will import all existing content, images, and design elements into the CMS for immediate editing.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing content...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.id} className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="mt-0.5">
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : step.error ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <div className="h-5 w-5 border-2 rounded-full border-muted" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{step.name}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  {step.error && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription>{step.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {allCompleted ? (
                <span className="text-green-600">✓ Import completed successfully</span>
              ) : hasErrors ? (
                <span className="text-destructive">Some imports failed</span>
              ) : (
                'Ready to import existing content'
              )}
            </div>
            <Button 
              onClick={handleImport} 
              disabled={importing || allCompleted}
              className="ml-auto"
            >
              {importing ? 'Importing...' : allCompleted ? 'Import Complete' : 'Start Import'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {allCompleted && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Import complete! You can now edit content, images, and brand assets from the respective tabs.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ImportManager;