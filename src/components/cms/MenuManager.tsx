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
import { Plus, Trash2, GripVertical, Mail, ExternalLink } from 'lucide-react';

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
      const { error } = await supabase
        .from('cms_menu_items')
        .update({
          item_name: item.item_name,
          price: item.price,
          description: item.description,
          is_email: item.is_email,
          is_link: item.is_link,
          link_url: item.link_url,
          published: item.published
        })
        .eq('id', item.id);

      if (error) throw error;

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Menu Manager - {pageTitle}</h2>
        <p className="text-muted-foreground">
          Manage menu sections and items for the {pageTitle} page
        </p>
      </div>

      {/* Create New Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Section</CardTitle>
          <CardDescription>Create a new menu section for this page</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Section name (e.g., Coffee, Pastries)"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createSection()}
            />
            <Button onClick={createSection} disabled={!newSectionName.trim()}>
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
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Input
                  value={section.section_name}
                  onChange={(e) => {
                    const updatedSection = { ...section, section_name: e.target.value };
                    setSections(sections.map(s => s.id === section.id ? updatedSection : s));
                  }}
                  onBlur={() => updateSection(section)}
                  className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
                />
                <div className="flex items-center gap-4">
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createItem(section.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteSection(section.id)}
                  className="text-destructive hover:text-destructive"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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