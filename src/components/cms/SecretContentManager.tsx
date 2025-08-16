import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Trash2, Plus, Save } from 'lucide-react';

interface SecretContent {
  id: string;
  modal_type: string;
  content_section: string;
  content_key: string;
  content_value: string;
  content_data?: any;
  published: boolean;
}

interface SecretContentManagerProps {
  type: 'lucky_seven' | 'beer' | 'kitchens';
  pageTitle: string;
}

const contentSections = {
  lucky_seven: [
    { key: 'title', label: 'Modal Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'unlock_message', label: 'Unlock Message', type: 'textarea' },
    { key: 'content_text', label: 'Main Content', type: 'textarea' }
  ],
  beer: [
    { key: 'title', label: 'Modal Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'beer_selection', label: 'Beer Selection Text', type: 'textarea' },
    { key: 'special_offer', label: 'Special Offer', type: 'textarea' }
  ],
  kitchens: [
    { key: 'title', label: 'Modal Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'kitchen_info', label: 'Kitchen Information', type: 'textarea' },
    { key: 'booking_text', label: 'Booking Information', type: 'textarea' }
  ]
};

export const SecretContentManager = ({ type, pageTitle }: SecretContentManagerProps) => {
  const [content, setContent] = useState<SecretContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContentKey, setNewContentKey] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
  }, [type]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cms_modal_content')
        .select('*')
        .eq('modal_type', type)
        .order('content_key');

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching secret content:', error);
      toast({
        title: "Error",
        description: "Failed to fetch secret content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createContent = async () => {
    if (!newContentKey.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('cms_modal_content')
        .insert({
          modal_type: type,
          content_section: 'main',
          content_key: newContentKey.trim(),
          content_value: '',
          created_by: user.id,
          published: false
        });

      if (error) throw error;

      setNewContentKey('');
      await fetchContent();
      toast({
        title: "Success",
        description: "Content item created successfully",
      });
    } catch (error) {
      console.error('Error creating content:', error);
      toast({
        title: "Error",
        description: "Failed to create content item",
        variant: "destructive",
      });
    }
  };

  const updateContent = async (id: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('cms_modal_content')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      setContent(prev => 
        prev.map(item => 
          item.id === id ? { ...item, [field]: value } : item
        )
      );

      toast({
        title: "Success",
        description: "Content updated successfully",
      });
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive",
      });
    }
  };

  const deleteContent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cms_modal_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchContent();
      toast({
        title: "Success",
        description: "Content item deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content item",
        variant: "destructive",
      });
    }
  };

  const createDefaultContent = async () => {
    if (!user) return;

    const sections = contentSections[type];
    for (const section of sections) {
      const exists = content.find(item => item.content_key === section.key);
      if (!exists) {
        try {
          await supabase
            .from('cms_modal_content')
            .insert({
              modal_type: type,
              content_section: 'main',
              content_key: section.key,
              content_value: `Default ${section.label.toLowerCase()}`,
              created_by: user.id,
              published: false
            });
        } catch (error) {
          console.error(`Error creating default content for ${section.key}:`, error);
        }
      }
    }

    await fetchContent();
    toast({
      title: "Success",
      description: "Default content structure created",
    });
  };

  if (loading) {
    return <div className="p-6">Loading secret content...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{pageTitle}</h2>
        <p className="text-muted-foreground">
          Manage content for the secret {type.replace('_', ' ')} modal accessible to members
        </p>
      </div>

      {content.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Required</CardTitle>
            <CardDescription>
              No content found for this secret modal. Create the default structure to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={createDefaultContent}>
              <Plus className="mr-2 h-4 w-4" />
              Create Default Content Structure
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add New Content Item</CardTitle>
          <CardDescription>
            Create a new content field for this secret modal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Content key (e.g., special_message)"
              value={newContentKey}
              onChange={(e) => setNewContentKey(e.target.value)}
            />
            <Button onClick={createContent} disabled={!newContentKey.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {content.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{item.content_key}</CardTitle>
                  <CardDescription>Content section: {item.content_section}</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`published-${item.id}`}
                      checked={item.published}
                      onCheckedChange={(checked) => updateContent(item.id, 'published', checked)}
                    />
                    <Label htmlFor={`published-${item.id}`}>Published</Label>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteContent(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor={`key-${item.id}`}>Content Key</Label>
                <Input
                  id={`key-${item.id}`}
                  value={item.content_key}
                  onChange={(e) => updateContent(item.id, 'content_key', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`content-${item.id}`}>Content Value</Label>
                <Textarea
                  id={`content-${item.id}`}
                  value={item.content_value}
                  onChange={(e) => updateContent(item.id, 'content_value', e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {content.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No content items found. Create some content to get started.
        </div>
      )}
    </div>
  );
};