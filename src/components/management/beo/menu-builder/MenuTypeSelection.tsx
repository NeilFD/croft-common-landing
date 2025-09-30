import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChefHat, Pizza, Utensils, PenLine } from 'lucide-react';

export type HallsMenuType = 'deli-style' | 'plated-3-course' | 'feast-style' | 'bespoke';
export type HideoutMenuType = 'takeaway-sections' | 'pre-selected';
export type MenuType = HallsMenuType | HideoutMenuType;

export interface MenuTypeOption {
  id: MenuType;
  name: string;
  description: string;
  icon: React.ReactNode;
  venue: 'halls' | 'hideout';
}

const hallsMenuTypes: MenuTypeOption[] = [
  {
    id: 'deli-style',
    name: 'Deli Style',
    description: 'Casual buffet with fresh sandwiches, salads, and deli items',
    icon: <Utensils className="h-6 w-6" />,
    venue: 'halls'
  },
  {
    id: 'plated-3-course',
    name: 'Plated 3 Course',
    description: 'Formal three-course meal with starter, main, and dessert',
    icon: <ChefHat className="h-6 w-6" />,
    venue: 'halls'
  },
  {
    id: 'feast-style',
    name: 'Feast Style',
    description: 'Sharing platters and family-style dishes for the table',
    icon: <Pizza className="h-6 w-6" />,
    venue: 'halls'
  },
  {
    id: 'bespoke',
    name: 'Bespoke',
    description: 'Custom menu with free-form items and pricing',
    icon: <PenLine className="h-6 w-6" />,
    venue: 'halls'
  }
];

const hideoutMenuTypes: MenuTypeOption[] = [
  {
    id: 'takeaway-sections',
    name: 'Takeaway (By Section)',
    description: 'Mix and match from: Bites & Small Plates, Pizzas, Mains, Sides, Desserts',
    icon: <Pizza className="h-6 w-6" />,
    venue: 'hideout'
  },
  {
    id: 'pre-selected',
    name: 'Pre-selected Takeaways',
    description: 'Choose from: Pizza & Small Plates, Big Grill, The Roast, Hideout All In',
    icon: <ChefHat className="h-6 w-6" />,
    venue: 'hideout'
  }
];

interface MenuTypeSelectionProps {
  onSelect: (menuType: MenuType) => void;
  venue?: 'halls' | 'hideout';
}

export const MenuTypeSelection: React.FC<MenuTypeSelectionProps> = ({ 
  onSelect, 
  venue = 'halls' 
}) => {
  const menuTypes = venue === 'halls' ? hallsMenuTypes : hideoutMenuTypes;
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-['Oswald'] text-xl mb-2">Select Menu Type</h3>
        <p className="text-muted-foreground text-sm">
          Choose the style of menu for this event at {venue === 'halls' ? 'Halls' : 'Hideout'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuTypes.map((type) => (
          <Card 
            key={type.id} 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => onSelect(type.id)}
          >
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {type.icon}
                </div>
                <div className="flex-1">
                  <CardTitle className="font-['Work_Sans'] text-base mb-1">
                    {type.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {type.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};
