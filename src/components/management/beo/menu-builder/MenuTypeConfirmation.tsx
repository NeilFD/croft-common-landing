import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { MenuType } from './MenuTypeSelection';

interface MenuTypeConfirmationProps {
  menuType: MenuType;
  onConfirm: () => void;
  onBack: () => void;
}

const menuTypeDetails: Record<MenuType, { name: string; description: string; items: string[] }> = {
  'deli-style': {
    name: 'Deli Style',
    description: 'A casual buffet setup with fresh deli items',
    items: ['Sandwiches & Wraps', 'Fresh Salads', 'Deli Platters', 'Sides & Accompaniments']
  },
  'plated-3-course': {
    name: 'Plated 3 Course',
    description: 'A formal three-course meal service',
    items: ['Starter Selection', 'Main Course Selection', 'Dessert Selection', 'Coffee & Tea']
  },
  'feast-style': {
    name: 'Feast Style',
    description: 'Sharing platters and family-style dishes',
    items: ['Sharing Starters', 'Main Course Platters', 'Sides & Accompaniments', 'Dessert Platters']
  },
  'bespoke': {
    name: 'Bespoke Menu',
    description: 'Custom menu with your own items and pricing',
    items: ['Add any custom courses', 'Set individual prices', 'Full flexibility']
  },
  'takeaway-sections': {
    name: 'Takeaway (By Section)',
    description: 'Mix and match items from different menu sections',
    items: ['Bites & Small Plates', 'Pizzas', 'Mains', 'Sides', 'Desserts']
  },
  'pre-selected': {
    name: 'Pre-selected Takeaways',
    description: 'Choose from curated takeaway packages',
    items: ['Pizza & Small Plates', 'The Big Grill', 'The Roast', 'The Hideout All In']
  }
};

export const MenuTypeConfirmation: React.FC<MenuTypeConfirmationProps> = ({
  menuType,
  onConfirm,
  onBack
}) => {
  const details = menuTypeDetails[menuType];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="font-['Oswald'] text-xl mb-2">
                {details.name}
              </CardTitle>
              <CardDescription>
                {details.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-['Work_Sans'] font-medium mb-3">Available Sections:</h4>
            <ul className="space-y-2">
              {details.items.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={onBack}>
              Change Menu Type
            </Button>
            <Button onClick={onConfirm}>
              Confirm & Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
