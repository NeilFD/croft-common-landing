import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, RotateCcw, Pencil } from 'lucide-react';
import { EventMenu, useBEOMutations } from '@/hooks/useBEOData';
import { Input } from '@/components/ui/input';
import { useKitchensMenuData } from '@/hooks/useKitchensCMSData';
import { MenuTypeSelection, MenuType } from './menu-builder/MenuTypeSelection';
import { MenuTypeConfirmation } from './menu-builder/MenuTypeConfirmation';
import { MenuItemSelection } from './menu-builder/MenuItemSelection';

interface MenuBuilderProps {
  eventId: string;
  menus: EventMenu[];
}

type WizardStep = 'type-selection' | 'confirmation' | 'item-selection' | 'complete';

export const MenuBuilder: React.FC<MenuBuilderProps> = ({ eventId, menus }) => {
  const [wizardStep, setWizardStep] = useState<WizardStep>('type-selection');
  const [selectedMenuType, setSelectedMenuType] = useState<MenuType | null>(null);

  const { deleteMenuItem, updateMenuItem } = useBEOMutations(eventId);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState<any>({});
  
  // Fetch available menu content from CMS
  const { data: hallsMenuData } = useKitchensMenuData('halls');
  const { data: hideoutMenuData } = useKitchensMenuData('hideout');

  const handleMenuTypeSelect = (menuType: MenuType) => {
    setSelectedMenuType(menuType);
    setWizardStep('confirmation');
  };

  const handleConfirm = () => {
    setWizardStep('item-selection');
  };

  const handleBack = () => {
    if (wizardStep === 'confirmation') {
      setWizardStep('type-selection');
    } else if (wizardStep === 'item-selection') {
      setWizardStep('confirmation');
    }
  };

  const handleComplete = () => {
    setWizardStep('complete');
  };

  const handleStartOver = () => {
    setSelectedMenuType(null);
    setWizardStep('type-selection');
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
      {/* Progress Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={wizardStep === 'type-selection' ? 'default' : 'secondary'}>1. Select Type</Badge>
        <div className="h-px w-8 bg-border" />
        <Badge variant={wizardStep === 'confirmation' ? 'default' : 'secondary'}>2. Confirm</Badge>
        <div className="h-px w-8 bg-border" />
        <Badge variant={wizardStep === 'item-selection' ? 'default' : 'secondary'}>3. Select Items</Badge>
        {wizardStep === 'complete' && (
          <>
            <div className="h-px w-8 bg-border" />
            <Badge variant="default">✓ Complete</Badge>
          </>
        )}
      </div>

      {/* Current Menu Items */}
      {menus.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-['Oswald'] text-lg">Current Menu Items</CardTitle>
              <Badge variant="secondary">{menus.length} items</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(groupedMenus).map(([course, items]) => (
                <div key={course} className="space-y-2">
                  <h4 className="font-['Work_Sans'] font-semibold text-sm text-muted-foreground">
                    {course}
                  </h4>
                  {items.map((item) => (
                    <div key={item.id} className="p-3 border rounded-lg">
                      {editingId === item.id ? (
                        <div className="space-y-3">
                          <Input
                            value={editForm.item_name || ''}
                            onChange={(e) => setEditForm({...editForm, item_name: e.target.value})}
                            placeholder="Item name"
                          />
                          <Input
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                            placeholder="Description"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            value={editForm.price || ''}
                            onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                            placeholder="Price"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                updateMenuItem.mutate({
                                  id: item.id,
                                  ...editForm,
                                  price: editForm.price ? parseFloat(editForm.price) : undefined
                                });
                                setEditingId(null);
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-['Work_Sans'] font-medium text-sm">{item.item_name}</span>
                              {item.price && (
                                <Badge variant="secondary" className="text-xs">£{item.price}</Badge>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mb-1">{item.description}</p>
                            )}
                            {item.allergens && item.allergens.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.allergens.map((allergen) => (
                                  <Badge key={allergen} variant="outline" className="text-xs">
                                    {allergen}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingId(item.id);
                                setEditForm({
                                  item_name: item.item_name,
                                  description: item.description || '',
                                  price: item.price || ''
                                });
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteMenuItem.mutate(item.id)}
                              disabled={deleteMenuItem.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wizard Steps */}
      <Card>
        <CardContent className="pt-6">
          {wizardStep === 'type-selection' && (
            <MenuTypeSelection 
              onSelect={handleMenuTypeSelect}
              venue="halls"
            />
          )}

          {wizardStep === 'confirmation' && selectedMenuType && (
            <MenuTypeConfirmation
              menuType={selectedMenuType}
              onConfirm={handleConfirm}
              onBack={handleBack}
            />
          )}

          {wizardStep === 'item-selection' && selectedMenuType && (
            <MenuItemSelection
              menuType={selectedMenuType}
              eventId={eventId}
              hallsMenuData={hallsMenuData}
              hideoutMenuData={hideoutMenuData}
              onBack={handleBack}
              onComplete={handleComplete}
            />
          )}

          {wizardStep === 'complete' && (
            <div className="text-center py-8 space-y-4">
              <div className="text-5xl mb-4">✓</div>
              <h3 className="font-['Oswald'] text-xl">Menu Items Added Successfully</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Your menu items have been added to the event. You can add more or move to the next section.
              </p>
              <Button onClick={handleStartOver} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Add More Items
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};