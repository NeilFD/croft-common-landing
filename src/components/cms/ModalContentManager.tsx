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
import { Trash2, Plus } from 'lucide-react';

interface ModalContent {
  id: string;
  modal_type: string;
  content_section: string;
  content_key: string;
  content_value: string;
  content_data?: any;
  published: boolean;
}

const modalTypes = [
  { value: 'auth', label: 'Authentication Modal' },
  { value: 'membership', label: 'Membership Modal' },
  { value: 'booking', label: 'Booking Modal' },
  { value: 'newsletter', label: 'Newsletter Signup' },
  { value: 'loyalty', label: 'Loyalty Card Modal' },
  { value: 'event', label: 'Event Details Modal' }
];

const contentSections = [
  { value: 'header', label: 'Header' },
  { value: 'body', label: 'Body Content' },
  { value: 'footer', label: 'Footer' },
  { value: 'buttons', label: 'Button Text' },
  { value: 'forms', label: 'Form Labels' }
];

export const ModalContentManager = () => {
  const [content, setContent] = useState<ModalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModalType, setSelectedModalType] = useState('auth');
  const [newItem, setNewItem] = useState({
    content_section: 'header',
    content_key: '',
    content_value: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
  }, [selectedModalType]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cms_modal_content')
        .select('*')
        .eq('modal_type', selectedModalType)
        .order('content_section', { ascending: true })
        .order('content_key', { ascending: true });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching modal content:', error);
      toast({
        title: "Error",
        description: "Failed to fetch modal content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createContent = async () => {
    if (!newItem.content_key.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('cms_modal_content')
        .insert({
          modal_type: selectedModalType,
          content_section: newItem.content_section,
          content_key: newItem.content_key.trim(),
          content_value: newItem.content_value,
          created_by: user.id,
          published: false
        });

      if (error) throw error;

      setNewItem({
        content_section: 'header',
        content_key: '',
        content_value: ''
      });
      await fetchContent();
      toast({
        title: "Success",
        description: "Modal content created successfully",
      });
    } catch (error) {
      console.error('Error creating modal content:', error);
      toast({
        title: "Error",
        description: "Failed to create modal content",
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
        description: "Modal content deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete modal content",
        variant: "destructive",
      });
    }
  };

  const createDefaultModalContent = async () => {
    if (!user) return;

    const defaultContent = [
      { section: 'header', key: 'title', value: 'Modal Title' },
      { section: 'header', key: 'subtitle', value: 'Modal subtitle or description' },
      { section: 'body', key: 'main_text', value: 'Main modal content goes here' },
      { section: 'buttons', key: 'primary_button', value: 'Continue' },
      { section: 'buttons', key: 'secondary_button', value: 'Cancel' }
    ];

    for (const item of defaultContent) {
      const exists = content.find(c => c.content_section === item.section && c.content_key === item.key);
      if (!exists) {
        try {
          await supabase
            .from('cms_modal_content')
            .insert({
              modal_type: selectedModalType,
              content_section: item.section,
              content_key: item.key,
              content_value: item.value,
              created_by: user.id,
              published: false
            });
        } catch (error) {
          console.error(`Error creating default content:`, error);
        }
      }
    }

    await fetchContent();
    toast({
      title: "Success",
      description: "Default modal content created",
    });
  };

  if (loading) {
    return <div className="p-6">Loading modal content...</div>;
  }

  const groupedContent = content.reduce((groups, item) => {
    const section = item.content_section;
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(item);
    return groups;
  }, {} as Record<string, ModalContent[]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Modal Content Manager</h2>
        <p className="text-muted-foreground">
          Manage content for different modal dialogs throughout the site
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Modal Type</CardTitle>
          <CardDescription>
            Choose which modal you want to manage content for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedModalType} onValueChange={setSelectedModalType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select modal type" />
            </SelectTrigger>
            <SelectContent>
              {modalTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {content.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Required</CardTitle>
            <CardDescription>
              No content found for this modal type. Create the default structure to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={createDefaultModalContent}>
              <Plus className="mr-2 h-4 w-4" />
              Create Default Modal Content
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add New Content Item</CardTitle>
          <CardDescription>
            Create a new content field for the selected modal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="content-section">Content Section</Label>
              <Select 
                value={newItem.content_section} 
                onValueChange={(value) => setNewItem(prev => ({ ...prev, content_section: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {contentSections.map((section) => (
                    <SelectItem key={section.value} value={section.value}>
                      {section.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="content-key">Content Key</Label>
              <Input
                id="content-key"
                placeholder="e.g., welcome_message"
                value={newItem.content_key}
                onChange={(e) => setNewItem(prev => ({ ...prev, content_key: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="content-value">Content Value</Label>
            <Textarea
              id="content-value"
              placeholder="Enter the content text"
              value={newItem.content_value}
              onChange={(e) => setNewItem(prev => ({ ...prev, content_value: e.target.value }))}
              rows={3}
            />
          </div>
          <Button onClick={createContent} disabled={!newItem.content_key.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Content Item
          </Button>
        </CardContent>
      </Card>

      {Object.entries(groupedContent).map(([section, items]) => (
        <Card key={section}>
          <CardHeader>
            <CardTitle className="capitalize">{section} Content</CardTitle>
            <CardDescription>
              Content items for the {section} section of the {modalTypes.find(t => t.value === selectedModalType)?.label}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{item.content_key}</Label>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`published-${item.id}`}
                        checked={item.published}
                        onCheckedChange={(checked) => updateContent(item.id, 'published', checked)}
                      />
                      <Label htmlFor={`published-${item.id}`} className="text-sm">Published</Label>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`key-${item.id}`} className="text-sm">Content Key</Label>
                    <Input
                      id={`key-${item.id}`}
                      value={item.content_key}
                      onChange={(e) => updateContent(item.id, 'content_key', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`section-${item.id}`} className="text-sm">Section</Label>
                    <Select 
                      value={item.content_section} 
                      onValueChange={(value) => updateContent(item.id, 'content_section', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {contentSections.map((section) => (
                          <SelectItem key={section.value} value={section.value}>
                            {section.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor={`content-${item.id}`} className="text-sm">Content Value</Label>
                  <Textarea
                    id={`content-${item.id}`}
                    value={item.content_value}
                    onChange={(e) => updateContent(item.id, 'content_value', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {content.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No content items found. Create some content to get started.
        </div>
      )}
    </div>
  );
};