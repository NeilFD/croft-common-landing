import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MenuItemProps {
  name: string;
  description: string;
  price: number;
  category: string;
}

const menuItems: MenuItemProps[] = [
  {
    name: "The Deli",
    description: "Mortadella, salami, prosciutto. Provolone. Roasted peppers. Sharp oregano oil. Proper Italian stacked in a focaccia roll.",
    price: 9.50,
    category: "sandwich"
  },
  {
    name: "The Reuben", 
    description: "Salt beef. Swiss. Sauerkraut. Russian dressing. Griddled rye. New York in a handful.",
    price: 9.50,
    category: "sandwich"
  },
  {
    name: "The Med",
    description: "Chargrilled courgette, aubergine and pepper. Whipped feta, lemon, rocket. Black olive tapenade on ciabatta.",
    price: 8.50,
    category: "sandwich"
  },
  {
    name: "The Club",
    description: "Roast chicken, bacon, lettuce, tomato. Mayo on toasted sourdough. Simple, classic, perfect.",
    price: 9.00,
    category: "sandwich"
  }
];

const drinkItems: MenuItemProps[] = [
  {
    name: "Fresh Orange Juice",
    description: "Freshly squeezed Valencia oranges",
    price: 3.50,
    category: "drink"
  },
  {
    name: "Craft Coffee",
    description: "Single origin Ethiopian beans, expertly roasted",
    price: 2.80,
    category: "drink"
  },
  {
    name: "Sparkling Water",
    description: "Natural mineral water with bubbles",
    price: 2.00,
    category: "drink"
  },
  {
    name: "Homemade Lemonade", 
    description: "Fresh lemons, mint, and a touch of honey",
    price: 3.20,
    category: "drink"
  }
];

export const UnavailableMenuDisplay = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Our Menu</h2>
        <p className="text-muted-foreground">
          Orders close at 11:00 AM, but here's what we'll be serving today
        </p>
      </div>

      {/* Sandwiches */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xl font-semibold">Sandwiches</h3>
          <Badge variant="secondary">Four builds available</Badge>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <Card key={index} className="h-full">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-lg">{item.name}</h4>
                  <span className="font-bold text-primary">£{item.price.toFixed(2)}</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Drinks */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xl font-semibold">Drinks</h3>
          <Badge variant="secondary">Fresh selections</Badge>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {drinkItems.map((item, index) => (
            <Card key={index} className="h-full">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-lg">{item.name}</h4>
                  <span className="font-bold text-primary">£{item.price.toFixed(2)}</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="text-center pt-6 border-t">
        <p className="text-sm text-muted-foreground">
          Orders open again tomorrow at 9:00 AM • Collection from 12:00 PM onwards
        </p>
      </div>
    </div>
  );
};