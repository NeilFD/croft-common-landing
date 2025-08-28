import { useState, useEffect } from 'react';
import { Plus, Edit as EditIcon, Trash2, Save, X, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FAQItem {
  id?: string;
  page: string;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
}

interface FAQManagerProps {
  page: string;
  onPublish?: () => void;
}

export const FAQManager = ({ page, onPublish }: FAQManagerProps) => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newFAQ, setNewFAQ] = useState<Omit<FAQItem, 'id'>>({
    page,
    question: '',
    answer: '',
    sort_order: 0,
    published: true
  });
  const { toast } = useToast();

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_faq_content')
        .select('*')
        .eq('page', page)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast({
        title: "Error",
        description: "Failed to load FAQ content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (faq: FAQItem) => {
    try {
      const { error } = await supabase
        .from('cms_faq_content')
        .update({
          question: faq.question,
          answer: faq.answer,
          published: faq.published
        })
        .eq('id', faq.id);

      if (error) throw error;

      await fetchFAQs();
      setEditingId(null);
      toast({
        title: "Success",
        description: "FAQ updated successfully"
      });
    } catch (error) {
      console.error('Error updating FAQ:', error);
      toast({
        title: "Error",
        description: "Failed to update FAQ",
        variant: "destructive"
      });
    }
  };

  const handleAdd = async () => {
    try {
      const maxOrder = Math.max(...faqs.map(f => f.sort_order), 0);
      
      const { error } = await supabase
        .from('cms_faq_content')
        .insert({
          ...newFAQ,
          sort_order: maxOrder + 1,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      await fetchFAQs();
      setIsAdding(false);
      setNewFAQ({
        page,
        question: '',
        answer: '',
        sort_order: 0,
        published: true
      });
      toast({
        title: "Success",
        description: "FAQ added successfully"
      });
    } catch (error) {
      console.error('Error adding FAQ:', error);
      toast({
        title: "Error",
        description: "Failed to add FAQ",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cms_faq_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchFAQs();
      toast({
        title: "Success",
        description: "FAQ deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast({
        title: "Error",
        description: "Failed to delete FAQ",
        variant: "destructive"
      });
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = faqs.findIndex(f => f.id === id);
    if ((direction === 'up' && currentIndex === 0) || 
        (direction === 'down' && currentIndex === faqs.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const reorderedFaqs = [...faqs];
    [reorderedFaqs[currentIndex], reorderedFaqs[newIndex]] = [reorderedFaqs[newIndex], reorderedFaqs[currentIndex]];

    // Update sort orders
    const updates = reorderedFaqs.map((faq, index) => ({
      id: faq.id,
      sort_order: index + 1
    }));

    try {
      for (const update of updates) {
        const { error } = await supabase
          .from('cms_faq_content')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      await fetchFAQs();
    } catch (error) {
      console.error('Error reordering FAQs:', error);
      toast({
        title: "Error",
        description: "Failed to reorder FAQs",
        variant: "destructive"
      });
    }
  };

  const handlePublish = async () => {
    if (onPublish) {
      onPublish();
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, [page]);

  if (loading) {
    return <div className="p-6">Loading FAQ content...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">FAQ Management - {page}</h2>
        <div className="flex gap-2">
          <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
          <Button onClick={handlePublish} variant="default">
            Publish Changes
          </Button>
        </div>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add New FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Question"
              value={newFAQ.question}
              onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
            />
            <Textarea
              placeholder="Answer"
              value={newFAQ.answer}
              onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
              rows={4}
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={newFAQ.published}
                onCheckedChange={(checked) => setNewFAQ({ ...newFAQ, published: checked })}
              />
              <span>Published</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={!newFAQ.question || !newFAQ.answer}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={() => setIsAdding(false)} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Card key={faq.id}>
            <CardContent className="p-4">
              {editingId === faq.id ? (
                <div className="space-y-4">
                  <Input
                    value={faq.question}
                    onChange={(e) => setFaqs(faqs.map(f => 
                      f.id === faq.id ? { ...f, question: e.target.value } : f
                    ))}
                  />
                  <Textarea
                    value={faq.answer}
                    onChange={(e) => setFaqs(faqs.map(f => 
                      f.id === faq.id ? { ...f, answer: e.target.value } : f
                    ))}
                    rows={4}
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={faq.published}
                      onCheckedChange={(checked) => setFaqs(faqs.map(f => 
                        f.id === faq.id ? { ...f, published: checked } : f
                      ))}
                    />
                    <span>Published</span>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleSave(faq)} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={() => setEditingId(null)} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium">{faq.question}</h3>
                      <p className="text-muted-foreground mt-1">{faq.answer}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          faq.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {faq.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button
                        onClick={() => handleReorder(faq.id!, 'up')}
                        size="sm"
                        variant="outline"
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleReorder(faq.id!, 'down')}
                        size="sm"
                        variant="outline"
                        disabled={index === faqs.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => setEditingId(faq.id!)} size="sm" variant="outline">
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={() => handleDelete(faq.id!)} 
                        size="sm" 
                        variant="outline"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {faqs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No FAQs found for this page. Click "Add FAQ" to create one.
        </div>
      )}
    </div>
  );
};