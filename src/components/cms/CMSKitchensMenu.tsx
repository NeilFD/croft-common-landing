import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useKitchensMenuData } from '@/hooks/useKitchensCMSData';

interface CMSKitchensMenuProps {
  tab: string;
  onDataUpdate?: () => void;
}

export const CMSKitchensMenu: React.FC<CMSKitchensMenuProps> = ({ tab, onDataUpdate }) => {
  const { toast } = useToast();
  const { data: menuData, loading, error } = useKitchensMenuData(tab);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);

  const handleAddSection = async () => {
    if (!newSectionName.trim()) return;

    try {
      const { error } = await supabase
        .from('cms_menu_sections')
        .insert({
          page: `kitchens-${tab}`,
          section_name: newSectionName,
          sort_order: (menuData?.length || 0) * 10 + 10,
          published: true
        });

      if (error) throw error;

      toast({ title: 'Success', description: 'Section added successfully' });
      setNewSectionName('');
      setIsAddingSection(false);
      onDataUpdate?.();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add section', variant: 'destructive' });
    }
  };

  const handleAddItem = async (sectionId: string) => {
    try {
      const { error } = await supabase
        .from('cms_menu_items')
        .insert({
          section_id: sectionId,
          item_name: 'New Item',
          description: 'Item description',
          price: '£0',
          sort_order: 10,
          published: true
        });

      if (error) throw error;

      toast({ title: 'Success', description: 'Item added successfully' });
      onDataUpdate?.();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add item', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading menu data...</div>;
  }

  if (error || !menuData) {
    return (
      <div className="text-center py-8">
        <p className="text-foreground/70 mb-4">
          No menu data found for {tab} tab. This will use fallback data on the live site.
        </p>
        <Button onClick={() => setIsAddingSection(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add First Section
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {tab.charAt(0).toUpperCase() + tab.slice(1)} Menu
        </h2>
        <Button onClick={() => setIsAddingSection(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
      </div>

      {isAddingSection && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Section name"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
              />
              <Button onClick={handleAddSection}>
                <Save className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => setIsAddingSection(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {menuData.map((section, sectionIndex) => (
        <Card key={sectionIndex}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{section.title}</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {/* Add edit section logic */}}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {/* Add section item logic with sectionId */}}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-foreground/70">{item.description}</p>
                      )}
                      {item.price && (
                        <p className="text-sm font-medium text-foreground">{item.price}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};