import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Save } from 'lucide-react';

interface GlobalContent {
  id: string;
  content_type: string;
  content_key: string;
  content_value: string;
  content_data?: any;
  published: boolean;
}

interface GlobalContentManagerProps {
  contentType: 'footer' | 'subscription_form' | 'navigation' | 'modals';
}

const contentTypeConfig = {
  footer: {
    title: 'Footer Content',
    description: 'Manage footer content including hours, contact information, and legal text',
    defaultKeys: [
      'opening_hours_title',
      'opening_hours_text',
      'contact_title',
      'contact_address',
      'contact_phone',
      'contact_email',
      'legal_text',
      'copyright_text'
    ]
  },
  subscription_form: {
    title: 'Subscription Form',
    description: 'Manage subscription form headlines, descriptions, and interest categories',
    defaultKeys: [
      'homepage_headline',
      'homepage_description',
      'footer_headline',
      'footer_description',
      'success_message',
      'error_message',
      'interest_categories'
    ]
  },
  navigation: {
    title: 'Navigation',
    description: 'Manage navigation menu items and their display text',
    defaultKeys: [
      'nav_home',
      'nav_cafe',
      'nav_cocktails',
      'nav_beer',
      'nav_kitchens',
      'nav_hall',
      'nav_community',
      'nav_common_room'
    ]
  },
  modals: {
    title: 'Modal Content',
    description: 'Manage content for authentication, membership, and other modal dialogs',
    defaultKeys: [
      'auth_welcome_title',
      'auth_welcome_text',
      'membership_title',
      'membership_description',
      'booking_title',
      'booking_description'
    ]
  }
};

export const GlobalContentManager = ({ contentType }: GlobalContentManagerProps) => {
  const [content, setContent] = useState<GlobalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const config = contentTypeConfig[contentType];

  useEffect(() => {
    fetchContent();
  }, [contentType]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cms_global_content')
        .select('*')
        .eq('content_type', contentType)
        .order('content_key');

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching global content:', error);
      toast({
        title: "Error",
        description: "Failed to load content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createContent = async () => {
    if (!newKey.trim() || !newValue.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('cms_global_content')
        .insert([{
          content_type: contentType,
          content_key: newKey.trim(),
          content_value: newValue.trim(),
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setContent([...content, data]);
      setNewKey('');
      setNewValue('');
      
      toast({
        title: "Success",
        description: "Content created successfully"
      });
    } catch (error) {
      console.error('Error creating content:', error);
      toast({
        title: "Error",
        description: "Failed to create content",
        variant: "destructive"
      });
    }
  };

  const updateContent = async (item: GlobalContent) => {
    try {
      const { error } = await supabase
        .from('cms_global_content')
        .update({
          content_key: item.content_key,
          content_value: item.content_value,
          published: item.published
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content updated successfully"
      });
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive"
      });
    }
  };

  const deleteContent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cms_global_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContent(content.filter(c => c.id !== id));
      
      toast({
        title: "Success",
        description: "Content deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive"
      });
    }
  };

  const createDefaultContent = async (key: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cms_global_content')
        .insert([{
          content_type: contentType,
          content_key: key,
          content_value: `Default ${key.replace(/_/g, ' ')} content`,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setContent([...content, data]);
      
      toast({
        title: "Success",
        description: "Default content created"
      });
    } catch (error) {
      console.error('Error creating default content:', error);
      toast({
        title: "Error",
        description: "Failed to create default content",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading content...</div>;
  }

  const existingKeys = content.map(c => c.content_key);
  const missingKeys = config.defaultKeys.filter(key => !existingKeys.includes(key));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{config.title}</h2>
        <p className="text-muted-foreground">{config.description}</p>
      </div>

      {/* Missing Default Content */}
      {missingKeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Default Content</CardTitle>
            <CardDescription>
              Create missing standard content items for this section
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {missingKeys.map(key => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => createDefaultContent(key)}
                  className="gap-2"
                >
                  <Plus className="h-3 w-3" />
                  {key.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Content */}
      <Card>
        <CardHeader>
          <CardTitle>Add Custom Content</CardTitle>
          <CardDescription>Create a new content item for this section</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Content key (e.g., footer_copyright)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
            <Input
              placeholder="Content value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
            <Button 
              onClick={createContent} 
              disabled={!newKey.trim() || !newValue.trim()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Content
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Content */}
      <div className="space-y-4">
        {content.map((item) => (
          <Card key={item.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor={`key-${item.id}`}>Content Key</Label>
                    <Input
                      id={`key-${item.id}`}
                      value={item.content_key}
                      onChange={(e) => {
                        const updatedItem = { ...item, content_key: e.target.value };
                        setContent(content.map(c => c.id === item.id ? updatedItem : c));
                      }}
                      onBlur={() => updateContent(item)}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`published-${item.id}`}
                        checked={item.published}
                        onCheckedChange={(checked) => {
                          const updatedItem = { ...item, published: checked };
                          setContent(content.map(c => c.id === item.id ? updatedItem : c));
                          updateContent(updatedItem);
                        }}
                      />
                      <Label htmlFor={`published-${item.id}`} className="text-sm">
                        Published
                      </Label>
                    </div>
                    
                    <Badge variant={item.published ? "default" : "secondary"}>
                      {item.published ? "Live" : "Draft"}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteContent(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor={`value-${item.id}`}>Content Value</Label>
                  <Textarea
                    id={`value-${item.id}`}
                    value={item.content_value}
                    onChange={(e) => {
                      const updatedItem = { ...item, content_value: e.target.value };
                      setContent(content.map(c => c.id === item.id ? updatedItem : c));
                    }}
                    onBlur={() => updateContent(item)}
                    rows={item.content_value.length > 100 ? 4 : 2}
                    className="resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {content.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              No content items created yet. Add your first content item above or use the default content buttons.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
