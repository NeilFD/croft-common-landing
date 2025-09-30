import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus } from 'lucide-react';
import { MenuType } from './MenuTypeSelection';
import { KitchensMenuSection } from '@/hooks/useKitchensCMSData';
import { useBEOMutations } from '@/hooks/useBEOData';
import { useToast } from '@/hooks/use-toast';

interface MenuItemSelectionProps {
  menuType: MenuType;
  eventId: string;
  hallsMenuData?: KitchensMenuSection[];
  hideoutMenuData?: KitchensMenuSection[];
  onBack: () => void;
  onComplete: () => void;
}

interface SelectedItem {
  name: string;
  description?: string;
  price?: string;
  quantity: number;
  course: string;
}

export const MenuItemSelection: React.FC<MenuItemSelectionProps> = ({
  menuType,
  eventId,
  hallsMenuData,
  hideoutMenuData,
  onBack,
  onComplete
}) => {
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItem>>({});
  const { addMenuItem } = useBEOMutations(eventId);
  const { toast } = useToast();

  const getRelevantSections = useMemo(() => {
    const menuData = menuType.includes('takeaway') || menuType === 'pre-selected' 
      ? hideoutMenuData 
      : hallsMenuData;

    if (!menuData) return [];

    // Filter sections based on menu type
    if (menuType === 'takeaway-sections') {
      return menuData.filter(section => 
        ['Bites & Small Plates', 'Pizzas', 'Mains', 'Sides', 'Desserts'].includes(section.title)
      );
    }

    if (menuType === 'pre-selected') {
      return menuData.filter(section => 
        ['Pizza & Small Plates', 'The Big Grill', 'The Roast', 'The Hideout All In'].includes(section.title)
      );
    }

    // For other menu types, return all sections
    return menuData;
  }, [menuType, hallsMenuData, hideoutMenuData]);

  const toggleItem = (item: any, sectionTitle: string) => {
    const key = `${sectionTitle}-${item.name}`;
    
    if (selectedItems[key]) {
      const { [key]: _, ...rest } = selectedItems;
      setSelectedItems(rest);
    } else {
      setSelectedItems(prev => ({
        ...prev,
        [key]: {
          name: item.name,
          description: item.description,
          price: item.price,
          quantity: 1,
          course: sectionTitle
        }
      }));
    }
  };

  const updateQuantity = (key: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedItems(prev => ({
      ...prev,
      [key]: { ...prev[key], quantity }
    }));
  };

  const handleAddToMenu = async () => {
    const items = Object.values(selectedItems);
    
    if (items.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one menu item",
        variant: "destructive"
      });
      return;
    }

    let addedCount = 0;
    
    for (const item of items) {
      try {
        await addMenuItem.mutateAsync({
          course: item.course,
          item_name: `${item.name} (x${item.quantity})`,
          description: item.description,
          price: item.price ? parseFloat(item.price) * item.quantity : undefined,
          notes: `Quantity: ${item.quantity}`
        });
        addedCount++;
      } catch (error) {
        console.error('Error adding menu item:', error);
      }
    }

    if (addedCount > 0) {
      toast({
        title: "Menu items added",
        description: `Successfully added ${addedCount} item(s) to the menu`
      });
      setSelectedItems({});
      onComplete();
    }
  };

  const selectedCount = Object.keys(selectedItems).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        {selectedCount > 0 && (
          <Badge variant="secondary">
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </Badge>
        )}
      </div>

      {getRelevantSections.length === 0 && menuType === 'bespoke' && (
        <Card>
          <CardHeader>
            <CardTitle className="font-['Oswald'] text-lg">Bespoke Menu</CardTitle>
            <CardDescription>
              Create custom menu items using the form below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use the "Add Menu Item" form at the bottom of this page to create your custom menu items with your own pricing and descriptions.
            </p>
          </CardContent>
        </Card>
      )}

      {getRelevantSections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="font-['Oswald'] text-lg">{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {section.items.map((item, idx) => {
                const key = `${section.title}-${item.name}`;
                const isSelected = !!selectedItems[key];
                
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleItem(item, section.title)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-['Work_Sans'] font-medium text-sm">{item.name}</span>
                        {item.price && (
                          <Badge variant="secondary" className="text-xs">£{item.price}</Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`qty-${key}`} className="text-xs whitespace-nowrap">Qty:</Label>
                        <Input
                          id={`qty-${key}`}
                          type="number"
                          min="1"
                          value={selectedItems[key].quantity}
                          onChange={(e) => updateQuantity(key, parseInt(e.target.value) || 1)}
                          className="w-16 h-8"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedCount > 0 && (
        <div className="sticky bottom-4 flex justify-end">
          <Button 
            size="lg" 
            onClick={handleAddToMenu}
            disabled={addMenuItem.isPending}
            className="shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {selectedCount} Item{selectedCount !== 1 ? 's' : ''} to Menu
          </Button>
        </div>
      )}
    </div>
  );
};
