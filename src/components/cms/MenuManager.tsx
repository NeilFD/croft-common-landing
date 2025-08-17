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
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, GripVertical, Mail, ExternalLink, Wand2 } from 'lucide-react';
import { sanitizeContentText, bulkCleanContent } from '@/lib/contentSanitizer';

interface MenuSection {
  id: string;
  page: string;
  section_name: string;
  sort_order: number;
  published: boolean;
}

interface MenuItem {
  id: string;
  section_id: string;
  item_name: string;
  price?: string;
  description?: string;
  is_email: boolean;
  is_link: boolean;
  link_url?: string;
  sort_order: number;
  published: boolean;
}

interface MenuManagerProps {
  page: string;
  pageTitle: string;
}

export const MenuManager = ({ page, pageTitle }: MenuManagerProps) => {
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [items, setItems] = useState<Record<string, MenuItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [newSectionName, setNewSectionName] = useState('');
  const [cleaningContent, setCleaningContent] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMenuData();
  }, [page]);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      
      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('cms_menu_sections')
        .select('*')
        .eq('page', page)
        .order('sort_order');

      if (sectionsError) throw sectionsError;
      setSections(sectionsData || []);

      // Fetch items for all sections
      if (sectionsData?.length) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('cms_menu_items')
          .select('*')
          .in('section_id', sectionsData.map(s => s.id))
          .order('sort_order');

        if (itemsError) throw itemsError;

        // Group items by section_id
        const groupedItems = itemsData?.reduce((acc, item) => {
          if (!acc[item.section_id]) acc[item.section_id] = [];
          acc[item.section_id].push(item);
          return acc;
        }, {} as Record<string, MenuItem[]>) || {};

        setItems(groupedItems);
      }
    } catch (error) {
      console.error('Error fetching menu data:', error);
      toast({
        title: "Error",
        description: "Failed to load menu data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createSection = async () => {
    if (!newSectionName.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('cms_menu_sections')
        .insert([{
          page,
          section_name: newSectionName.trim(),
          sort_order: sections.length,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setSections([...sections, data]);
      setNewSectionName('');
      
      toast({
        title: "Success",
        description: "Menu section created successfully"
      });
    } catch (error) {
      console.error('Error creating section:', error);
      toast({
        title: "Error",
        description: "Failed to create menu section",
        variant: "destructive"
      });
    }
  };

  const updateSection = async (section: MenuSection) => {
    try {
      const { error } = await supabase
        .from('cms_menu_sections')
        .update({
          section_name: section.section_name,
          published: section.published
        })
        .eq('id', section.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Section updated successfully"
      });
    } catch (error) {
      console.error('Error updating section:', error);
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive"
      });
    }
  };

  const deleteSection = async (sectionId: string) => {
    try {
      const { error } = await supabase
        .from('cms_menu_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;

      setSections(sections.filter(s => s.id !== sectionId));
      setItems(prev => {
        const newItems = { ...prev };
        delete newItems[sectionId];
        return newItems;
      });

      toast({
        title: "Success",
        description: "Section deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({
        title: "Error",
        description: "Failed to delete section",
        variant: "destructive"
      });
    }
  };

  const createItem = async (sectionId: string) => {
    if (!user) return;

    try {
      const sectionItems = items[sectionId] || [];
      const { data, error } = await supabase
        .from('cms_menu_items')
        .insert([{
          section_id: sectionId,
          item_name: 'New Item',
          sort_order: sectionItems.length,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setItems(prev => ({
        ...prev,
        [sectionId]: [...(prev[sectionId] || []), data]
      }));

      toast({
        title: "Success",
        description: "Menu item created successfully"
      });
    } catch (error) {
      console.error('Error creating item:', error);
      toast({
        title: "Error",
        description: "Failed to create menu item",
        variant: "destructive"
      });
    }
  };

  const updateItem = async (item: MenuItem) => {
    try {
      // Clean text fields before saving
      const cleanedItem = {
        ...item,
        item_name: sanitizeContentText(item.item_name),
        description: item.description ? sanitizeContentText(item.description) : item.description,
        price: item.price ? sanitizeContentText(item.price) : item.price
      };

      const { error } = await supabase
        .from('cms_menu_items')
        .update({
          item_name: cleanedItem.item_name,
          price: cleanedItem.price,
          description: cleanedItem.description,
          is_email: item.is_email,
          is_link: item.is_link,
          link_url: item.link_url,
          published: item.published
        })
        .eq('id', item.id);

      if (error) throw error;

      // Update local state with cleaned data
      setItems(prev => ({
        ...prev,
        [item.section_id]: prev[item.section_id]?.map(i => 
          i.id === item.id ? cleanedItem : i
        ) || []
      }));

      toast({
        title: "Success",
        description: "Item updated successfully"
      });
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive"
      });
    }
  };

  const cleanAllMenuContent = async () => {
    if (!user) return;

    setCleaningContent(true);
    try {
      let totalCleaned = 0;
      let totalFailed = 0;

      // Clean all menu items
      for (const sectionItems of Object.values(items)) {
        const records = sectionItems.map(item => ({
          id: item.id,
          content: [item.item_name, item.description, item.price].filter(Boolean).join(' ')
        }));

        const { success, failed } = await bulkCleanContent(
          records,
          async (id, cleanedContent) => {
            const item = sectionItems.find(i => i.id === id);
            if (!item) return;

            const { error } = await supabase
              .from('cms_menu_items')
              .update({
                item_name: sanitizeContentText(item.item_name),
                description: item.description ? sanitizeContentText(item.description) : item.description,
                price: item.price ? sanitizeContentText(item.price) : item.price,
              })
              .eq('id', id);

            if (error) throw error;
          }
        );

        totalCleaned += success;
        totalFailed += failed;
      }

      if (totalCleaned > 0) {
        await fetchMenuData(); // Refresh data
        toast({
          title: "Success",
          description: `Cleaned ${totalCleaned} menu items`
        });
      } else {
        toast({
          title: "Info",
          description: "No menu content needed cleaning"
        });
      }

      if (totalFailed > 0) {
        toast({
          title: "Warning",
          description: `Failed to clean ${totalFailed} items`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error cleaning menu content:', error);
      toast({
        title: "Error",
        description: "Failed to clean menu content",
        variant: "destructive"
      });
    } finally {
      setCleaningContent(false);
    }
  };

  const deleteItem = async (itemId: string, sectionId: string) => {
    try {
      const { error } = await supabase
        .from('cms_menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => ({
        ...prev,
        [sectionId]: prev[sectionId]?.filter(item => item.id !== itemId) || []
      }));

      toast({
        title: "Success",
        description: "Item deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading menu data...</div>;
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight break-words">Menu Manager - {pageTitle}</h2>
          <p className="text-muted-foreground break-words">
            Manage menu sections and items for the {pageTitle} page
          </p>
        </div>
        {sections.length > 0 && (
          <Button
            variant="outline"
            onClick={cleanAllMenuContent}
            disabled={cleaningContent}
            className="w-full sm:w-auto flex-shrink-0 min-h-[44px] sm:min-h-auto"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {cleaningContent ? 'Cleaning...' : 'Clean All HTML'}
          </Button>
        )}
      </div>

      {/* Create New Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Section</CardTitle>
          <CardDescription>Create a new menu section for this page</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Section name (e.g., Coffee, Pastries)"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createSection()}
              className="flex-1 w-full"
            />
            <Button onClick={createSection} disabled={!newSectionName.trim()} className="w-full sm:w-auto min-h-[44px] sm:min-h-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Menu Sections */}
      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="space-y-3">
                <Input
                  value={section.section_name}
                  onChange={(e) => {
                    const updatedSection = { ...section, section_name: e.target.value };
                    setSections(sections.map(s => s.id === section.id ? updatedSection : s));
                  }}
                  onBlur={() => updateSection(section)}
                  className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0 w-full"
                />
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`published-${section.id}`}
                      checked={section.published}
                      onCheckedChange={(checked) => {
                        const updatedSection = { ...section, published: checked };
                        setSections(sections.map(s => s.id === section.id ? updatedSection : s));
                        updateSection(updatedSection);
                      }}
                    />
                    <Label htmlFor={`published-${section.id}`} className="text-sm">
                      Published
                    </Label>
                  </div>
                  <Badge variant={section.published ? "default" : "secondary"}>
                    {section.published ? "Live" : "Draft"}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createItem(section.id)}
                  className="flex-1 min-h-[44px] sm:min-h-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteSection(section.id)}
                  className="text-destructive hover:text-destructive flex-1 min-h-[44px] sm:min-h-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(items[section.id] || []).map((item) => (
                <Card key={item.id} className="border-l-4 border-l-accent">
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`name-${item.id}`}>Item Name</Label>
                          <Input
                            id={`name-${item.id}`}
                            value={item.item_name}
                            onChange={(e) => {
                              const updatedItem = { ...item, item_name: e.target.value };
                              setItems(prev => ({
                                ...prev,
                                [section.id]: prev[section.id]?.map(i => i.id === item.id ? updatedItem : i) || []
                              }));
                            }}
                            onBlur={() => updateItem(item)}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`price-${item.id}`}>Price (optional)</Label>
                          <Input
                            id={`price-${item.id}`}
                            placeholder="£5.50"
                            value={item.price || ''}
                            onChange={(e) => {
                              const updatedItem = { ...item, price: e.target.value };
                              setItems(prev => ({
                                ...prev,
                                [section.id]: prev[section.id]?.map(i => i.id === item.id ? updatedItem : i) || []
                              }));
                            }}
                            onBlur={() => updateItem(item)}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`description-${item.id}`}>Description (optional)</Label>
                          <Textarea
                            id={`description-${item.id}`}
                            placeholder="Item description..."
                            value={item.description || ''}
                            onChange={(e) => {
                              const updatedItem = { ...item, description: e.target.value };
                              setItems(prev => ({
                                ...prev,
                                [section.id]: prev[section.id]?.map(i => i.id === item.id ? updatedItem : i) || []
                              }));
                            }}
                            onBlur={() => updateItem(item)}
                            rows={3}
                            className="whitespace-pre-wrap word-wrap break-words resize-y"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`email-${item.id}`}
                            checked={item.is_email}
                            onCheckedChange={(checked) => {
                              const updatedItem = { ...item, is_email: checked };
                              setItems(prev => ({
                                ...prev,
                                [section.id]: prev[section.id]?.map(i => i.id === item.id ? updatedItem : i) || []
                              }));
                              updateItem(updatedItem);
                            }}
                          />
                          <Label htmlFor={`email-${item.id}`} className="text-sm flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Email Link
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`link-${item.id}`}
                            checked={item.is_link}
                            onCheckedChange={(checked) => {
                              const updatedItem = { ...item, is_link: checked };
                              setItems(prev => ({
                                ...prev,
                                [section.id]: prev[section.id]?.map(i => i.id === item.id ? updatedItem : i) || []
                              }));
                              updateItem(updatedItem);
                            }}
                          />
                          <Label htmlFor={`link-${item.id}`} className="text-sm flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            External Link
                          </Label>
                        </div>

                        {item.is_link && (
                          <Input
                            placeholder="https://..."
                            value={item.link_url || ''}
                            onChange={(e) => {
                              const updatedItem = { ...item, link_url: e.target.value };
                              setItems(prev => ({
                                ...prev,
                                [section.id]: prev[section.id]?.map(i => i.id === item.id ? updatedItem : i) || []
                              }));
                            }}
                            onBlur={() => updateItem(item)}
                            className="w-48"
                          />
                        )}

                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`published-item-${item.id}`}
                            checked={item.published}
                            onCheckedChange={(checked) => {
                              const updatedItem = { ...item, published: checked };
                              setItems(prev => ({
                                ...prev,
                                [section.id]: prev[section.id]?.map(i => i.id === item.id ? updatedItem : i) || []
                              }));
                              updateItem(updatedItem);
                            }}
                          />
                          <Label htmlFor={`published-item-${item.id}`} className="text-sm">
                            Published
                          </Label>
                        </div>

                        <Badge variant={item.published ? "default" : "secondary"} className="text-xs">
                          {item.published ? "Live" : "Draft"}
                        </Badge>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteItem(item.id, section.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!items[section.id] || items[section.id].length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No items in this section. Click "Add Item" to create the first one.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {sections.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              No menu sections created yet. Add your first section above to get started.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};