import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  page: string;
  section: string;
  content_key: string;
  content_type: string;
  content_data: any;
  published: boolean;
}

const ContentManager = () => {
  const { user } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const pages = ['index', 'beer', 'cafe', 'cocktails', 'kitchens', 'hall'];

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_content')
        .select('*')
        .order('page', { ascending: true })
        .order('section', { ascending: true });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (item: ContentItem, newText: string) => {
    if (!user) return;

    setSaving(item.id);
    try {
      const { error } = await supabase
        .from('cms_content')
        .update({
          content_data: { text: newText },
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) throw error;

      setContent(prev => prev.map(c => 
        c.id === item.id 
          ? { ...c, content_data: { text: newText } }
          : c
      ));

      toast.success('Content updated successfully');
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating content:', error);
      toast.error('Failed to update content');
    } finally {
      setSaving(null);
    }
  };

  const getContentByPage = (page: string) => {
    return content.filter(item => item.page === page);
  };

  if (loading) {
    return <div className="text-center py-8">Loading content...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Page Content Management</CardTitle>
          <p className="text-muted-foreground">
            Edit headlines, descriptions, and other text content for each page.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue={pages[0]} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          {pages.map((page) => (
            <TabsTrigger key={page} value={page} className="capitalize">
              {page === 'index' ? 'Home' : page}
            </TabsTrigger>
          ))}
        </TabsList>

        {pages.map((page) => (
          <TabsContent key={page} value={page} className="space-y-4">
            <div className="grid gap-4">
              {getContentByPage(page).map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg capitalize">
                          {item.content_key.replace('_', ' ')}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {item.section} section
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {editingItem === item.id ? 'Cancel' : 'Edit'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingItem === item.id ? (
                      <EditableContent
                        item={item}
                        onSave={updateContent}
                        saving={saving === item.id}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap p-4 bg-muted rounded-md">
                        {item.content_data?.text || 'No content'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {getContentByPage(page).length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">
                      No content found for this page. 
                      <br />
                      Try importing content first from the Import tab.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

interface EditableContentProps {
  item: ContentItem;
  onSave: (item: ContentItem, newText: string) => void;
  saving: boolean;
}

const EditableContent = ({ item, onSave, saving }: EditableContentProps) => {
  const [text, setText] = useState(item.content_data?.text || '');

  const handleSave = () => {
    onSave(item, text);
  };

  const isMultiline = text.includes('\n') || text.length > 100;

  return (
    <div className="space-y-4">
      {isMultiline ? (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="min-h-32"
        />
      ) : (
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}
      
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleSave}
          disabled={saving || text === item.content_data?.text}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default ContentManager;