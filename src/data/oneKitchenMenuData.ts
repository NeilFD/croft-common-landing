export interface MenuItem {
  name: string;
  description: string;
  price: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const oneKitchenMenuData: MenuSection[] = [
  {
    title: "Bites",
    items: [
      {
        name: "Marinated Gordal Olives, Orange Zest",
        description: "plump, green, briny.",
        price: "£4"
      },
      {
        name: "Wood Oven Flatbread, Smoked Butter",
        description: "soft, blistered, butter from Somerset.",
        price: "£5"
      },
      {
        name: "Padron Peppers, Sea Salt, Ndjua",
        description: "",
        price: "£8"
      },
      {
        name: "Jamón Croquetas",
        description: "crisp, molten béchamel, Jamón Ibérico.",
        price: "£9"
      },
      {
        name: "Crispy Chickpeas, Chilli & Lime",
        description: "crunchy, sharp, fire snack.",
        price: "£6"
      },
      {
        name: "Whipped Cod Roe, Toasted Flatbread",
        description: "smoky, salty, whipped light.",
        price: "£8"
      },
      {
        name: "Smoked Almonds",
        description: "deep roast, sea salt.",
        price: "£4"
      }
    ]
  },
  {
    title: "Small Plates",
    items: [
      {
        name: "Charred Octopus, Potato, Aioli",
        description: "Galician style, tender with smoke.",
        price: "£10"
      },
      {
        name: "Beef Short Rib Croquettes",
        description: "rich, slow-cooked beef, crisp outside.",
        price: "£11"
      },
      {
        name: "Wood-Roast Aubergine, White Miso Glaze, Sesame",
        description: "umami depth, fire char.",
        price: "£8"
      },
      {
        name: "Chorizo al Vino",
        description: "Rioja reduction, garlic, heat.",
        price: "£8"
      },
      {
        name: "Smoked Bone Marrow, Toast, Parsley",
        description: "dripping richness.",
        price: "£9"
      },
      {
        name: "King Oyster Mushroom, Chimichurri",
        description: "meaty texture, green sharpness.",
        price: "£7"
      },
      {
        name: "Crispy Squid, Lemon, Seaweed Salt",
        description: "light fry, fresh squeeze.",
        price: "£11"
      },
      {
        name: "Cauliflower, Harissa Yoghurt, Almond",
        description: "scorched edges, sweet heat.",
        price: "£7"
      },
      {
        name: "Sticky Pork Belly, Burnt Pineapple",
        description: "sweet, char, fat and acid.",
        price: "£9"
      },
      {
        name: "Welsh Salt Marsh Lamb Chops, Mint, Smoked Salt",
        description: "tender, flame-licked.",
        price: "£14"
      },
      {
        name: "Seared Scallop, Brown Butter, Garlic Crumb",
        description: "West Country scallops, caramelised.",
        price: "£5 each"
      }
    ]
  },
  {
    title: "Wood-Fired Pizzas",
    items: [
      {
        name: "Margherita",
        description: "San Marzano tomato, Fior di Latte, Basil.",
        price: "£12"
      },
      {
        name: "Nduja",
        description: "tomato, spicy Calabrian sausage, ricotta, hot honey.",
        price: "£16"
      },
      {
        name: "Bianca",
        description: "garlic cream base, wild mushrooms, Taleggio.",
        price: "£14"
      },
      {
        name: "Prosciutto",
        description: "tomato, Parma ham, rocket, Parmesan.",
        price: "£16"
      },
      {
        name: "Four Cheese",
        description: "mozzarella, Gorgonzola, Taleggio, Pecorino.",
        price: "£14"
      },
      {
        name: "Clam Pizza",
        description: "garlic butter, fresh clams, chilli, lemon.",
        price: "£19"
      },
      {
        name: "Vegetale",
        description: "tomato, charred aubergine, courgette, peppers.",
        price: "£13"
      },
      {
        name: "Carne",
        description: "tomato, beef short rib, red onion, smoked chilli.",
        price: "£18"
      },
      {
        name: "Truffle Mushroom",
        description: "garlic cream, porcini, truffle oil, parmesan.",
        price: "£20"
      }
    ]
  },
  {
    title: "Charcoal Grill",
    items: [
      {
        name: "Flat Iron Steak, Chimichurri",
        description: "British rare breed, seared hot.",
        price: "£22"
      },
      {
        name: "Iberico Pork Chop, Apple & Mustard",
        description: "black pig richness, sweet edge.",
        price: "£28"
      },
      {
        name: "Half Chicken, Garlic & Lemon",
        description: "marinated, flame-charred.",
        price: "£18"
      },
      {
        name: "Whole Seabass, Chilli & Herb",
        description: "clean, charred skin, fresh herbs.",
        price: "£30"
      },
      {
        name: "Charred Hispi Cabbage, Black Garlic Butter",
        description: "caramelised layers, deep umami.",
        price: "£18"
      },
      {
        name: "Ribeye, Smoked Shallot",
        description: "grass-fed, seared on the bone.",
        price: "£36"
      },
      {
        name: "Welsh Salt Marsh Lamb Rump, Harissa & Mint",
        description: "fire, spice, sweet lamb.",
        price: "£32"
      },
      {
        name: "T-Bone, As is",
        description: "prime British beef, big cut.",
        price: "£40"
      }
    ]
  },
  {
    title: "Common Boards for 2",
    items: [
      {
        name: "Mixed Grill Board",
        description: "ribeye, Iberico pork, chicken, lamb ribs, sausage, chimichurri.",
        price: "£80"
      },
      {
        name: "Whole Roast Fish, Salsa Verde, Lemon Potatoes",
        description: "seabass or turbot, oven roasted.",
        price: "£60"
      },
      {
        name: "Charred Vegetable Board",
        description: "wood oven roots, flatbreads, whipped feta, pickles.",
        price: "£40"
      },
      {
        name: "Churrasco Feast",
        description: "lamb ribs, chicken thighs, beef, chilli sauces.",
        price: "£75"
      },
      {
        name: "Seafood Board",
        description: "octopus, squid, prawns, scallops, aioli, bread.",
        price: "£90"
      },
      {
        name: "Cheese & Charcuterie Board",
        description: "British cheeses, cured meats, pickles, chutney, artisan bread.",
        price: "£50"
      }
    ]
  },
  {
    title: "Beer Food",
    items: [
      {
        name: "Buffalo Wings, Blue Cheese",
        description: "hot sauce, cool dip.",
        price: "£8"
      },
      {
        name: "Korean Wings, Gochujang, Sesame",
        description: "sticky, spicy.",
        price: "£9"
      },
      {
        name: "BBQ Wings, Smoked Chilli",
        description: "sweet heat, char.",
        price: "£9"
      },
      {
        name: "Loaded Fries, Beer Cheese, Jalapeño",
        description: "rich, sharp, messy.",
        price: "£7"
      },
      {
        name: "Soft Pretzel, Beer Cheese Dip",
        description: "warm, salty, molten dip.",
        price: "£6"
      },
      {
        name: "Smash Burger, Pickles, American Cheese",
        description: "two patties, toasted bun.",
        price: "£14"
      },
      {
        name: "Buttermilk Fried Chicken Sandwich",
        description: "brioche, hot mayo, slaw.",
        price: "£12"
      },
      {
        name: "Pulled Pork Roll, Pickled Red Cabbage",
        description: "sweet, sour, rich pork.",
        price: "£12"
      },
      {
        name: "Bratwurst, Mustard, Pretzel Bun",
        description: "German classic, beer's best friend.",
        price: "£10"
      }
    ]
  },
  {
    title: "Sides",
    items: [
      {
        name: "Rosemary Fries",
        description: "crisp, salted.",
        price: "£5"
      },
      {
        name: "Wood Oven Potatoes, Garlic & Herb",
        description: "golden, blistered.",
        price: "£6"
      },
      {
        name: "Seasonal Greens, Lemon Oil",
        description: "light, sharp.",
        price: "£6"
      },
      {
        name: "Charred Corn, Chilli Butter",
        description: "sweet and hot.",
        price: "£5"
      },
      {
        name: "Tomato Salad, Basil, Olive Oil",
        description: "ripe, clean.",
        price: "£6"
      },
      {
        name: "Mac & Cheese, Toasted Crumb",
        description: "oven-baked, rich.",
        price: "£7"
      }
    ]
  },
  {
    title: "Pudding",
    items: [
      {
        name: "Basque Cheesecake, Burnt Top",
        description: "creamy, caramelised.",
        price: "£9"
      },
      {
        name: "Wood Oven Brownie, Vanilla Ice Cream",
        description: "dark, molten centre.",
        price: "£9"
      },
      {
        name: "Churros, Dark Chocolate",
        description: "crisp, sugar dusted, dipping pot.",
        price: "£8"
      },
      {
        name: "Affogato, Amaretto",
        description: "vanilla gelato drowned in espresso.",
        price: "£7"
      },
      {
        name: "Lemon Tart, Crème Fraîche",
        description: "sharp, smooth, buttery base.",
        price: "£8"
      },
      {
        name: "Sticky Toffee Pudding, Salted Caramel, Ice Cream",
        description: "indulgent, soft sponge.",
        price: "£9"
      }
    ]
  }
];