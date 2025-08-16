import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Edit, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { sanitizeContentText, bulkCleanContent } from '@/lib/contentSanitizer';

interface ContentItem {
  id: string;
  page: string;
  section: string;
  content_key: string;
  content_type: string;
  content_data: any;
  published: boolean;
}

interface ContentManagerProps {
  page?: string;
  pageTitle?: string;
  section?: string;
}

const ContentManager = ({ page: selectedPage, pageTitle, section: selectedSection }: ContentManagerProps = {}) => {
  const { user } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [cleaningContent, setCleaningContent] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [selectedPage, selectedSection]);

  const fetchContent = async () => {
    try {
      let query = supabase
        .from('cms_content')
        .select('*');

      if (selectedPage) {
        query = query.eq('page', selectedPage);
      }
      
      if (selectedSection) {
        query = query.eq('section', selectedSection);
      }

      const { data, error } = await query
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
      // Clean the text before saving
      const cleanedText = sanitizeContentText(newText);
      
      const { error } = await supabase
        .from('cms_content')
        .update({
          content_data: { text: cleanedText },
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) throw error;

      setContent(prev => prev.map(c => 
        c.id === item.id 
          ? { ...c, content_data: { text: cleanedText } }
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

  const cleanAllContent = async () => {
    if (!user) return;

    setCleaningContent(true);
    try {
      const records = content.map(item => ({
        id: item.id,
        content: item.content_data?.text || ''
      }));

      const { success, failed } = await bulkCleanContent(
        records,
        async (id, cleanedContent) => {
          const { error } = await supabase
            .from('cms_content')
            .update({
              content_data: { text: cleanedContent },
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);

          if (error) throw error;
        }
      );

      if (success > 0) {
        await fetchContent(); // Refresh content
        toast.success(`Cleaned ${success} content items`);
      } else {
        toast.info('No content needed cleaning');
      }

      if (failed > 0) {
        toast.error(`Failed to clean ${failed} items`);
      }
    } catch (error) {
      console.error('Error cleaning content:', error);
      toast.error('Failed to clean content');
    } finally {
      setCleaningContent(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading content...</div>;
  }

  const title = pageTitle ? `Content Manager - ${pageTitle}` : 'Content Manager';
  const description = selectedPage 
    ? `Manage content for the ${pageTitle || selectedPage} page${selectedSection ? ` (${selectedSection} section)` : ''}`
    : 'Manage content across all pages';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {content.length > 0 && (
          <Button
            variant="outline"
            onClick={cleanAllContent}
            disabled={cleaningContent}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {cleaningContent ? 'Cleaning...' : 'Clean All HTML'}
          </Button>
        )}
      </div>

      {content.length > 0 ? (
        <div className="space-y-4">
          {content.map(item => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {item.content_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {item.page} page • {item.section} section
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
                  <div className="whitespace-pre-wrap word-wrap break-words overflow-wrap-anywhere p-4 bg-muted rounded-md">
                    {item.content_data?.text || 'No content'}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              No content found{selectedPage ? ` for ${pageTitle || selectedPage}` : ''}. 
              Content will appear here once it's created.
            </div>
          </CardContent>
        </Card>
      )}
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
          className="min-h-32 whitespace-pre-wrap word-wrap break-words resize-y"
        />
      ) : (
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="word-wrap break-words"
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