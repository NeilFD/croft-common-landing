import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Upload, Palette, Type } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface BrandAsset {
  id: string;
  asset_key: string;
  asset_type: string;
  asset_value: string;
  description: string | null;
  published: boolean;
}

interface DesignToken {
  id: string;
  token_key: string;
  token_type: string;
  token_value: string;
  css_variable: string | null;
  description: string | null;
  published: boolean;
}

const BrandManager = () => {
  const { user } = useAuth();
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [designTokens, setDesignTokens] = useState<DesignToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrandData();
  }, []);

  const fetchBrandData = async () => {
    try {
      const [brandResponse, tokensResponse] = await Promise.all([
        supabase.from('cms_brand_assets').select('*').order('asset_type'),
        supabase.from('cms_design_tokens').select('*').order('token_type')
      ]);

      if (brandResponse.error) throw brandResponse.error;
      if (tokensResponse.error) throw tokensResponse.error;

      setBrandAssets(brandResponse.data || []);
      setDesignTokens(tokensResponse.data || []);
    } catch (error) {
      console.error('Error fetching brand data:', error);
      toast.error('Failed to load brand data');
    } finally {
      setLoading(false);
    }
  };

  const updateBrandAsset = async (assetId: string, updates: Partial<BrandAsset>) => {
    try {
      const { error } = await supabase
        .from('cms_brand_assets')
        .update(updates)
        .eq('id', assetId);

      if (error) throw error;

      setBrandAssets(prev => prev.map(asset => 
        asset.id === assetId ? { ...asset, ...updates } : asset
      ));

      toast.success('Brand asset updated successfully');
    } catch (error) {
      console.error('Error updating brand asset:', error);
      toast.error('Failed to update brand asset');
    }
  };

  const updateDesignToken = async (tokenId: string, updates: Partial<DesignToken>) => {
    try {
      const { error } = await supabase
        .from('cms_design_tokens')
        .update(updates)
        .eq('id', tokenId);

      if (error) throw error;

      setDesignTokens(prev => prev.map(token => 
        token.id === tokenId ? { ...token, ...updates } : token
      ));

      toast.success('Design token updated successfully');
    } catch (error) {
      console.error('Error updating design token:', error);
      toast.error('Failed to update design token');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading brand assets...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand & Design Management</CardTitle>
          <p className="text-muted-foreground">
            Manage logos, fonts, colors, and design tokens that control your site's appearance.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="assets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Brand Assets
          </TabsTrigger>
          <TabsTrigger value="tokens" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Design Tokens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <div className="grid gap-4">
            {brandAssets.map((asset) => (
              <Card key={asset.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg capitalize flex items-center gap-2">
                    {asset.asset_type === 'logo' ? <Upload className="h-4 w-4" /> : 
                     asset.asset_type === 'font' ? <Type className="h-4 w-4" /> : 
                     <Palette className="h-4 w-4" />}
                    {asset.asset_key.replace('_', ' ')}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {asset.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <BrandAssetEditor
                    asset={asset}
                    onSave={(updates) => updateBrandAsset(asset.id, updates)}
                  />
                </CardContent>
              </Card>
            ))}

            {brandAssets.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    No brand assets found. Try importing content first.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4">
          <div className="grid gap-4">
            {designTokens.map((token) => (
              <Card key={token.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg capitalize flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    {token.token_key.replace('_', ' ')}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {token.description} • {token.token_type}
                  </p>
                </CardHeader>
                <CardContent>
                  <DesignTokenEditor
                    token={token}
                    onSave={(updates) => updateDesignToken(token.id, updates)}
                  />
                </CardContent>
              </Card>
            ))}

            {designTokens.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    No design tokens found. Try importing content first.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface BrandAssetEditorProps {
  asset: BrandAsset;
  onSave: (updates: Partial<BrandAsset>) => void;
}

const BrandAssetEditor = ({ asset, onSave }: BrandAssetEditorProps) => {
  const [value, setValue] = useState(asset.asset_value);
  const [description, setDescription] = useState(asset.description || '');

  const handleSave = () => {
    onSave({ asset_value: value, description });
  };

  const isImage = asset.asset_type === 'logo' || asset.asset_type === 'icon';

  return (
    <div className="space-y-4">
      {isImage && asset.asset_value && (
        <div className="w-24 h-24 bg-muted rounded-md overflow-hidden">
          <img
            src={asset.asset_value}
            alt={asset.asset_key}
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Value</label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={isImage ? "Image URL" : "Asset value"}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Asset description"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={value === asset.asset_value && description === asset.description}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};

interface DesignTokenEditorProps {
  token: DesignToken;
  onSave: (updates: Partial<DesignToken>) => void;
}

const DesignTokenEditor = ({ token, onSave }: DesignTokenEditorProps) => {
  const [value, setValue] = useState(token.token_value);
  const [cssVariable, setCssVariable] = useState(token.css_variable || '');
  const [description, setDescription] = useState(token.description || '');

  const handleSave = () => {
    onSave({ 
      token_value: value, 
      css_variable: cssVariable,
      description 
    });
  };

  const isColor = token.token_type === 'color';

  return (
    <div className="space-y-4">
      {isColor && (
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-md border-2 border-border"
            style={{ backgroundColor: value.includes('hsl') ? value : `hsl(${value})` }}
          />
          <div className="text-sm text-muted-foreground">
            Color preview
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Token Value</label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Token value"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">CSS Variable</label>
          <Input
            value={cssVariable}
            onChange={(e) => setCssVariable(e.target.value)}
            placeholder="--variable-name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Token description"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={
            value === token.token_value && 
            cssVariable === token.css_variable &&
            description === token.description
          }
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default BrandManager;