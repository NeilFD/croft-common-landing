import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Copy } from 'lucide-react';
import { EventMenu, useBEOMutations } from '@/hooks/useBEOData';
import { useKitchensMenuData } from '@/hooks/useKitchensCMSData';

interface MenuBuilderProps {
  eventId: string;
  menus: EventMenu[];
}

export const MenuBuilder: React.FC<MenuBuilderProps> = ({ eventId, menus }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    course: '',
    item_name: '',
    description: '',
    price: '',
    notes: '',
    allergens: [] as string[]
  });

  const { addMenuItem } = useBEOMutations(eventId);
  
  // Fetch available menu content from CMS
  const { data: hallsMenuData } = useKitchensMenuData('halls');
  const { data: hideoutMenuData } = useKitchensMenuData('hideout');

  const courseOptions = [
    'Canapés',
    'Starters',
    'Mains',
    'Desserts',
    'Drinks',
    'Coffee & Tea',
    'Bar Service',
    'Breakfast',
    'Lunch',
    'Dinner'
  ];

  const commonAllergens = [
    'Gluten',
    'Dairy',
    'Eggs',
    'Nuts',
    'Peanuts',
    'Soy',
    'Fish',
    'Shellfish',
    'Sesame',
    'Sulphites'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addMenuItem.mutate({
      course: formData.course,
      item_name: formData.item_name,
      description: formData.description || undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
      notes: formData.notes || undefined,
      allergens: formData.allergens
    }, {
      onSuccess: () => {
        setFormData({
          course: '',
          item_name: '',
          description: '',
          price: '',
          notes: '',
          allergens: []
        });
        setShowAddForm(false);
      }
    });
  };

  const copyFromCMS = (menuItem: any, course: string) => {
    setFormData({
      course,
      item_name: menuItem.name,
      description: menuItem.description || '',
      price: menuItem.price || '',
      notes: '',
      allergens: []
    });
    setShowAddForm(true);
  };

  const toggleAllergen = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  const groupedMenus = menus.reduce((acc, menu) => {
    if (!acc[menu.course]) {
      acc[menu.course] = [];
    }
    acc[menu.course].push(menu);
    return acc;
  }, {} as Record<string, EventMenu[]>);

  return (
    <div className="space-y-6">
      {/* Menu Items by Course */}
      {Object.entries(groupedMenus).map(([course, items]) => (
        <Card key={course}>
          <CardHeader>
            <CardTitle className="font-['Oswald'] text-lg">{course}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-['Work_Sans'] font-medium">{item.item_name}</h4>
                      {item.price && (
                        <Badge variant="secondary">£{item.price}</Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    )}
                    {item.allergens && item.allergens.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.allergens.map((allergen) => (
                          <Badge key={allergen} variant="outline" className="text-xs">
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-xs text-muted-foreground italic">{item.notes}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* CMS Menu Quick Add */}
      {(hallsMenuData || hideoutMenuData) && (
        <Card>
          <CardHeader>
            <CardTitle className="font-['Oswald'] text-lg">Quick Add from Menu</CardTitle>
            <CardDescription>Copy items from existing kitchen menus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hallsMenuData?.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h4 className="font-['Work_Sans'] font-medium text-sm">{section.title} (Halls)</h4>
                  {section.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 text-sm border rounded">
                      <span>{item.name} - £{item.price}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyFromCMS(item, section.title)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ))}
              {hideoutMenuData?.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h4 className="font-['Work_Sans'] font-medium text-sm">{section.title} (Hideout)</h4>
                  {section.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 text-sm border rounded">
                      <span>{item.name} - £{item.price}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyFromCMS(item, section.title)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Menu Item */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-['Oswald'] text-lg">Menu Items</CardTitle>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </div>
        </CardHeader>
        {showAddForm && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="course">Course</Label>
                  <Select
                    value={formData.course}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, course: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseOptions.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="item_name">Item Name</Label>
                  <Input
                    id="item_name"
                    value={formData.item_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price (£)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Allergens</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {commonAllergens.map((allergen) => (
                      <Badge
                        key={allergen}
                        variant={formData.allergens.includes(allergen) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleAllergen(allergen)}
                      >
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addMenuItem.isPending}
                >
                  Add Menu Item
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
};