import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Trash2, Plus, Palette, Type, Ruler, Zap } from 'lucide-react';

interface DesignToken {
  id: string;
  token_type: string;
  token_key: string;
  token_value: string;
  css_variable: string;
  description?: string;
  published: boolean;
}

const tokenTypes = [
  { value: 'color', label: 'Colors', icon: Palette },
  { value: 'typography', label: 'Typography', icon: Type },
  { value: 'spacing', label: 'Spacing', icon: Ruler },
  { value: 'animation', label: 'Animation', icon: Zap }
];

const defaultTokens = {
  color: [
    { key: 'primary', value: '210 24% 16%', variable: '--primary', description: 'Primary brand color' },
    { key: 'secondary', value: '210 20% 25%', variable: '--secondary', description: 'Secondary brand color' },
    { key: 'accent', value: '41 88% 61%', variable: '--accent', description: 'Accent color for highlights' }
  ],
  typography: [
    { key: 'font-heading', value: '"Montserrat", sans-serif', variable: '--font-heading', description: 'Heading font family' },
    { key: 'font-body', value: '"Inter", sans-serif', variable: '--font-body', description: 'Body text font family' },
    { key: 'font-mono', value: '"Fira Code", monospace', variable: '--font-mono', description: 'Monospace font family' }
  ],
  spacing: [
    { key: 'spacing-xs', value: '0.25rem', variable: '--spacing-xs', description: 'Extra small spacing' },
    { key: 'spacing-sm', value: '0.5rem', variable: '--spacing-sm', description: 'Small spacing' },
    { key: 'spacing-md', value: '1rem', variable: '--spacing-md', description: 'Medium spacing' }
  ],
  animation: [
    { key: 'transition-fast', value: '0.15s ease-out', variable: '--transition-fast', description: 'Fast transitions' },
    { key: 'transition-normal', value: '0.3s ease-out', variable: '--transition-normal', description: 'Normal transitions' },
    { key: 'transition-slow', value: '0.5s ease-out', variable: '--transition-slow', description: 'Slow transitions' }
  ]
};

export const DesignTokenManager = () => {
  const [tokens, setTokens] = useState<DesignToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('color');
  const [newToken, setNewToken] = useState({
    token_key: '',
    token_value: '',
    css_variable: '',
    description: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchTokens();
  }, [selectedType]);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cms_design_tokens')
        .select('*')
        .eq('token_type', selectedType)
        .order('token_key');

      if (error) throw error;
      setTokens(data || []);
    } catch (error) {
      console.error('Error fetching design tokens:', error);
      toast({
        title: "Error",
        description: "Failed to fetch design tokens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createToken = async () => {
    if (!newToken.token_key.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('cms_design_tokens')
        .insert({
          token_type: selectedType,
          token_key: newToken.token_key.trim(),
          token_value: newToken.token_value,
          css_variable: newToken.css_variable || `--${newToken.token_key.trim()}`,
          description: newToken.description,
          created_by: user.id,
          published: false
        });

      if (error) throw error;

      setNewToken({
        token_key: '',
        token_value: '',
        css_variable: '',
        description: ''
      });
      await fetchTokens();
      toast({
        title: "Success",
        description: "Design token created successfully",
      });
    } catch (error) {
      console.error('Error creating design token:', error);
      toast({
        title: "Error",
        description: "Failed to create design token",
        variant: "destructive",
      });
    }
  };

  const updateToken = async (id: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('cms_design_tokens')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      setTokens(prev => 
        prev.map(token => 
          token.id === id ? { ...token, [field]: value } : token
        )
      );

      toast({
        title: "Success",
        description: "Design token updated successfully",
      });
    } catch (error) {
      console.error('Error updating design token:', error);
      toast({
        title: "Error",
        description: "Failed to update design token",
        variant: "destructive",
      });
    }
  };

  const deleteToken = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cms_design_tokens')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchTokens();
      toast({
        title: "Success",
        description: "Design token deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting design token:', error);
      toast({
        title: "Error",
        description: "Failed to delete design token",
        variant: "destructive",
      });
    }
  };

  const createDefaultTokens = async () => {
    if (!user) return;

    const defaults = defaultTokens[selectedType as keyof typeof defaultTokens];
    for (const token of defaults) {
      const exists = tokens.find(t => t.token_key === token.key);
      if (!exists) {
        try {
          await supabase
            .from('cms_design_tokens')
            .insert({
              token_type: selectedType,
              token_key: token.key,
              token_value: token.value,
              css_variable: token.variable,
              description: token.description,
              created_by: user.id,
              published: false
            });
        } catch (error) {
          console.error(`Error creating default token ${token.key}:`, error);
        }
      }
    }

    await fetchTokens();
    toast({
      title: "Success",
      description: "Default design tokens created",
    });
  };

  if (loading) {
    return <div className="p-6">Loading design tokens...</div>;
  }

  const selectedTypeInfo = tokenTypes.find(t => t.value === selectedType);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Design Token Manager</h2>
        <p className="text-muted-foreground">
          Manage design system tokens for colors, typography, spacing, and animations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {selectedTypeInfo && <selectedTypeInfo.icon className="h-5 w-5" />}
            Token Type
          </CardTitle>
          <CardDescription>
            Select which type of design tokens you want to manage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tokenTypes.map((type) => (
              <Button
                key={type.value}
                variant={selectedType === type.value ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setSelectedType(type.value)}
              >
                <type.icon className="h-5 w-5" />
                <span className="text-sm">{type.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {tokens.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Required</CardTitle>
            <CardDescription>
              No {selectedType} tokens found. Create the default tokens to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={createDefaultTokens}>
              <Plus className="mr-2 h-4 w-4" />
              Create Default {selectedTypeInfo?.label} Tokens
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add New {selectedTypeInfo?.label} Token</CardTitle>
          <CardDescription>
            Create a new {selectedType} token for your design system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="token-key">Token Key</Label>
              <Input
                id="token-key"
                placeholder="e.g., primary-blue"
                value={newToken.token_key}
                onChange={(e) => setNewToken(prev => ({ ...prev, token_key: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="css-variable">CSS Variable</Label>
              <Input
                id="css-variable"
                placeholder="e.g., --primary-blue"
                value={newToken.css_variable}
                onChange={(e) => setNewToken(prev => ({ ...prev, css_variable: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="token-value">Token Value</Label>
            <Input
              id="token-value"
              placeholder={selectedType === 'color' ? 'e.g., 210 24% 16%' : 'e.g., 1rem'}
              value={newToken.token_value}
              onChange={(e) => setNewToken(prev => ({ ...prev, token_value: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe how this token should be used"
              value={newToken.description}
              onChange={(e) => setNewToken(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>
          <Button onClick={createToken} disabled={!newToken.token_key.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Token
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {tokens.map((token) => (
          <Card key={token.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{token.token_key}</CardTitle>
                  <CardDescription>{token.css_variable}</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`published-${token.id}`}
                      checked={token.published}
                      onCheckedChange={(checked) => updateToken(token.id, 'published', checked)}
                    />
                    <Label htmlFor={`published-${token.id}`}>Published</Label>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteToken(token.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`key-${token.id}`}>Token Key</Label>
                  <Input
                    id={`key-${token.id}`}
                    value={token.token_key}
                    onChange={(e) => updateToken(token.id, 'token_key', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`variable-${token.id}`}>CSS Variable</Label>
                  <Input
                    id={`variable-${token.id}`}
                    value={token.css_variable}
                    onChange={(e) => updateToken(token.id, 'css_variable', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor={`value-${token.id}`}>Token Value</Label>
                <div className="flex gap-2">
                  <Input
                    id={`value-${token.id}`}
                    value={token.token_value}
                    onChange={(e) => updateToken(token.id, 'token_value', e.target.value)}
                  />
                  {selectedType === 'color' && token.token_value && (
                    <div 
                      className="w-10 h-10 rounded border border-border"
                      style={{ backgroundColor: `hsl(${token.token_value})` }}
                    />
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor={`description-${token.id}`}>Description</Label>
                <Textarea
                  id={`description-${token.id}`}
                  value={token.description || ''}
                  onChange={(e) => updateToken(token.id, 'description', e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tokens.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No {selectedType} tokens found. Create some tokens to get started.
        </div>
      )}
    </div>
  );
};