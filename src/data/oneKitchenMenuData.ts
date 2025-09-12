export interface MenuItem {
  name: string;
  description?: string;
  price?: string;
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
        price: "£6"
      },
      {
        name: "Wood Oven Flatbread, Smoked Butter",
        description: "soft, blistered, butter from Somerset.",
        price: "£5"
      },
      {
        name: "Padron Peppers, Sea Salt, Nduja",
        description: "charred, salted, hidden heat.",
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
      },
      {
        name: "Edamame, Chilli Salt",
        description: "steamed, tossed hot.",
        price: "£5"
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
        name: "Thai Spiced Fishcakes, Sweet Chilli Dip",
        description: "aromatic, punchy, bright.",
        price: "£8"
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
      },
      {
        name: "Karaage Fried Chicken, Yuzu Mayo",
        description: "crisp fry, citrus lift.",
        price: "£9"
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
        name: "Korean BBQ Beef",
        description: "gochujang glaze, spring onion, sesame.",
        price: "£18"
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
    title: "Large Plates",
    items: [
      {
        name: "Braised Beef Short Rib, Red Wine, Mash, Charred Carrot",
        description: "slow-cooked, falling apart, deep sauce.",
        price: "£24"
      },
      {
        name: "Confit Duck Leg, White Beans, Smoked Sausage, Gremolata",
        description: "cassoulet style, rich and rustic.",
        price: "£22"
      },
      {
        name: "Roast Cod, Brown Shrimp Butter, Spinach, Potato",
        description: "clean white fish, nutty butter sauce.",
        price: "£26"
      },
      {
        name: "Monkfish Tail, Tomato & Saffron Stew, Aioli",
        description: "Basque style, bold and bright.",
        price: "£28"
      },
      {
        name: "Wood Oven Gnocchi, Wild Mushrooms, Aged Parmesan",
        description: "pillowy, earthy, fire-licked.",
        price: "£20"
      },
      {
        name: "Charred Aubergine, Tahini, Pomegranate, Flatbread",
        description: "smoky, rich, sharp edge.",
        price: "£18"
      },
      {
        name: "Katsu Cauliflower, Curry Sauce, Pickles, Rice",
        description: "crisp fry, aromatic sauce.",
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
        name: "Miso Glazed Salmon, Sesame Greens",
        description: "sweet-savory glaze, charred edges.",
        price: "£28"
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
        name: "Churrasco Board",
        description: "lamb ribs, chicken thighs, beef, chilli sauces.",
        price: "£75"
      },
      {
        name: "Asian Board",
        description: "Korean short ribs, Thai fishcakes, miso salmon, kimchi slaw.",
        price: "£85"
      },
      {
        name: "Seafood Platter",
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
        name: "Bao Bun, Crispy Pork, Hoisin, Pickles",
        description: "soft, rich, sharp.",
        price: "£9"
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
      },
      {
        name: "Kimchi Slaw",
        description: "sharp, hot, fermented crunch.",
        price: "£5"
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
      },
      {
        name: "Mochi Ice Cream Trio",
        description: "matcha, mango, chocolate.",
        price: "£7"
      }
    ]
  },
  {
    title: "Breakfast",
    items: [
      {
        name: "Croft Common Full English",
        description: "rare breed sausage, smoked bacon, fried egg, tomato, mushroom, beans, sourdough.",
        price: "£14"
      },
      {
        name: "Veggie English",
        description: "field mushroom, halloumi, avocado, roast tomato, beans, sourdough.",
        price: "£11"
      },
      {
        name: "Eggs Benedict",
        description: "poached eggs, ham hock, hollandaise, muffin.",
        price: "£12"
      },
      {
        name: "Eggs Florentine",
        description: "poached eggs, spinach, hollandaise, muffin.",
        price: "£10"
      },
      {
        name: "Shakshuka",
        description: "spiced tomato, baked eggs, yoghurt, flatbread.",
        price: "£10"
      },
      {
        name: "Avocado & Poached Egg",
        description: "chilli, lime, pumpkin seeds, sourdough.",
        price: "£12"
      },
      {
        name: "Overnight Oats",
        description: "rolled oats, almond milk, berries, toasted seeds.",
        price: "£8"
      },
      {
        name: "Greek Yoghurt Bowl",
        description: "granola, honey, figs, pistachio.",
        price: "£7"
      }
    ]
  },
  {
    title: "Pastries",
    items: [
      {
        name: "Butter Croissant",
        description: "classic, flaky, French butter.",
        price: "£4"
      },
      {
        name: "Pain au Chocolat",
        description: "dark chocolate, laminated pastry.",
        price: "£4.5"
      },
      {
        name: "Almond Croissant",
        description: "filled, dusted, rich.",
        price: "£4.50"
      },
      {
        name: "Cinnamon Swirl",
        description: "buttery roll, sugar crust.",
        price: "£4.50"
      },
      {
        name: "Morning Bun",
        description: "orange zest, sugar crust, croissant dough.",
        price: "£4"
      }
    ]
  },
  {
    title: "Sandwiches",
    items: [
      {
        name: "Italian Deli",
        description: "salami, mortadella, provolone, pickles, ciabatta.",
        price: "£9"
      },
      {
        name: "Reuben",
        description: "salt beef, sauerkraut, Swiss cheese, Russian dressing, rye.",
        price: "£12"
      },
      {
        name: "Caprese",
        description: "buffalo mozzarella, heritage tomato, basil, focaccia.",
        price: "£8"
      },
      {
        name: "The Med",
        description: "roast vegetables, hummus, feta, ciabatta.",
        price: "£8"
      },
      {
        name: "Roast Chicken Caesar",
        description: "chicken, anchovy mayo, parmesan, cos lettuce, sourdough.",
        price: "£10"
      }
    ]
  },
  {
    title: "Salads & Bowls",
    items: [
      {
        name: "Roast Cauliflower, Tahini, Pomegranate",
        description: "spiced cauliflower, golden raisins, herbs, pistachio crunch.",
        price: "£9"
      },
      {
        name: "Freekeh & Squash Grain Salad",
        description: "charred butternut, pomegranate seeds, mint, green grains.",
        price: "£9"
      },
      {
        name: "Charred Broccoli & Almond",
        description: "tenderstem broccoli, chilli oil, garlic yoghurt, toasted nuts.",
        price: "£8"
      },
      {
        name: "Heritage Tomato & Burrata",
        description: "ripe tomatoes, creamy burrata, basil oil, sourdough crumbs.",
        price: "£12"
      },
      {
        name: "Sesame Soba Noodles",
        description: "chilled noodles, pak choi, cucumber, sesame peanut dressing.",
        price: "£9"
      },
      {
        name: "Salad Counter Plate",
        description: "choose any three of the above, generous plate.",
        price: "£12"
      }
    ]
  },
  {
    title: "Plates & Counter",
    items: [
      {
        name: "Frittata of the Day",
        description: "seasonal veg, herbs, cheese.",
        price: "£7"
      },
      {
        name: "Wood Oven Flatbread, Labneh, Za'atar Oil",
        description: "soft, blistered, tangy.",
        price: "£6"
      },
      {
        name: "Seasonal Tartlet",
        description: "roast tomato, ricotta, basil.",
        price: "£6"
      },
      {
        name: "Soup of the Day, Sourdough",
        description: "always fresh, always changing.",
        price: "£7"
      }
    ]
  },
  {
    title: "Sweets & Cakes",
    items: [
      {
        name: "Polenta & Orange Cake",
        description: "moist, citrus sharp, almond bite.",
        price: "£5"
      },
      {
        name: "Pistachio & Rose Cake",
        description: "nutty, floral, light sponge.",
        price: "£6"
      },
      {
        name: "Chocolate Babka",
        description: "dark, glossy, indulgent.",
        price: "£4"
      },
      {
        name: "Date & Walnut Slice",
        description: "sticky, rich, wholesome.",
        price: "£4"
      }
    ]
  },
  {
    title: "Breakfast & Brunch",
    items: [
      {
        name: "Croft Common Full English",
        description: "rare breed sausage, smoked bacon, fried egg, tomato, mushroom, beans, sourdough.",
        price: "£12"
      },
      {
        name: "Veggie English",
        description: "field mushroom, halloumi, avocado, roast tomato, beans, sourdough.",
        price: "£11"
      },
      {
        name: "Breakfast Pizza",
        description: "sourdough base, bacon, sausage, black pudding, egg, mozzarella, tomato.",
        price: "£14"
      },
      {
        name: "Eggs Benedict",
        description: "poached eggs, ham hock, hollandaise, muffin.",
        price: "£10"
      },
      {
        name: "Eggs Florentine",
        description: "poached eggs, spinach, hollandaise, muffin.",
        price: "£9"
      },
      {
        name: "Eggs Royale",
        description: "poached eggs, smoked salmon, hollandaise, muffin.",
        price: "£11"
      },
      {
        name: "Shakshuka",
        description: "spiced tomato, baked eggs, yoghurt, flatbread.",
        price: "£9"
      },
      {
        name: "Avocado & Poached Egg",
        description: "chilli, lime, pumpkin seeds, sourdough.",
        price: "£9"
      },
      {
        name: "Overnight Oats",
        description: "rolled oats, almond milk, berries, toasted seeds.",
        price: "£6"
      },
      {
        name: "Greek Yoghurt Bowl",
        description: "granola, honey, figs, pistachio.",
        price: "£7"
      },
      {
        name: "Oysters on Ice",
        description: "lemon, shallot vinegar, tabasco.",
        price: "£3 each"
      },
      {
        name: "Bloody Mary",
        description: "house mix, spice, celery.",
        price: "£8"
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
        name: "Crispy Squid, Lemon, Seaweed Salt",
        description: "light fry, fresh squeeze.",
        price: "£11"
      },
      {
        name: "Karaage Fried Chicken, Yuzu Mayo",
        description: "crisp fry, citrus lift.",
        price: "£9"
      },
      {
        name: "Chorizo al Vino",
        description: "Rioja reduction, garlic, heat.",
        price: "£8"
      },
      {
        name: "Welsh Salt Marsh Lamb Chops",
        description: "flame-licked, smoked salt, mint.",
        price: "£14"
      },
      {
        name: "Heritage Tomato & Burrata",
        description: "ripe tomatoes, creamy burrata, basil oil, sourdough crumbs.",
        price: "£10"
      }
    ]
  },
  {
    title: "Sunday Roasts",
    items: [
      {
        name: "Rib of Beef, Horseradish Cream",
        description: "All the trimmings.",
        price: "£24"
      },
      {
        name: "Roast Chicken, Bread Sauce",
        description: "All the trimmings.",
        price: "£18"
      },
      {
        name: "Roast of the Week",
        description: "lamb with mint sauce, or pork with apple sauce. All the trimmings.",
        price: "£20"
      },
      {
        name: "Vegetarian Roast, Mushroom Gravy",
        description: "All the trimmings.",
        price: "£16"
      }
    ]
  },
  {
    title: "All In Sharing Board (For Two)",
    items: [
      {
        name: "A little of everything",
        description: "rib of beef, roast chicken, roast of the week. all the trimmings, family-style, served on boards and stands.",
        price: "£45"
      }
    ]
  },
  {
    title: "Large Plates",
    items: [
      {
        name: "Miso Glazed Salmon, Sesame Greens",
        description: "sweet-savory glaze, charred edges.",
        price: "£28"
      },
      {
        name: "Wood Oven Gnocchi, Wild Mushrooms, Aged Parmesan",
        description: "pillowy, earthy, fire-licked.",
        price: "£20"
      },
      {
        name: "Braised Beef Short Rib, Red Wine, Mash, Charred Carrot",
        description: "slow-cooked, falling apart, deep sauce.",
        price: "£24"
      },
      {
        name: "Confit Duck Leg, White Beans, Smoked Sausage, Gremolata",
        description: "cassoulet style, rustic and rich.",
        price: "£22"
      },
      {
        name: "Charred Aubergine, Tahini, Pomegranate, Flatbread",
        description: "smoky, rich, sharp edge.",
        price: "£18"
      }
    ]
  },
  {
    title: "Sunday Puddings",
    items: [
      {
        name: "Apple Pie & Custard",
        description: "buttery pastry, soft apples.",
        price: "£7"
      },
      {
        name: "Jam Roly Poly & Custard",
        description: "warm, nostalgic, steamed roll.",
        price: "£7"
      },
      {
        name: "Bread & Butter Pudding, Raisins, Cream",
        description: "soft layers, caramelised top.",
        price: "£7"
      },
      {
        name: "Sticky Toffee Pudding, Salted Caramel, Ice Cream",
        description: "indulgent, soft sponge.",
        price: "£9"
      },
      {
        name: "Treacle Sponge & Custard",
        description: "steamed, golden syrup, light sponge.",
        price: "£7"
      },
      {
        name: "Rhubarb Crumble & Custard",
        description: "sharp fruit, buttery topping.",
        price: "£7"
      }
    ]
  },

  // The Hideout - Private Dining
  {
    title: "HOW IT WORKS",
    items: [
      { name: "For groups of 10+ only.", price: "" },
      { name: "Pre-order in advance.", price: "" },
      { name: "Takeaway style. Roof terrace vibes.", price: "" },
      { name: "Order individual dishes, or go easy with a full per-head pack.", price: "" }
    ]
  },
  {
    title: "BITES & SMALL PLATES",
    items: [
      { name: "Padron Peppers, Sea Salt", price: "£6" },
      { name: "Jamón Croquetas", price: "£9" },
      { name: "Sticky Pork Belly, Burnt Pineapple", price: "£9" },
      { name: "Karaage Fried Chicken, Yuzu Mayo", price: "£9" },
      { name: "Crispy Squid, Lemon, Seaweed Salt", price: "£11" },
      { name: "Wood-Roast Aubergine, Miso Glaze", price: "£8" }
    ]
  },
  {
    title: "PIZZAS",
    items: [
      { name: "Margherita", price: "£12" },
      { name: "Nduja, Ricotta, Hot Honey", price: "£15" },
      { name: "Prosciutto & Rocket", price: "£15" },
      { name: "Vegetale", price: "£13" },
      { name: "Korean BBQ Beef", price: "£18" },
      { name: "All pizzas boxed, sliced, and good to go.", price: "" }
    ]
  },
  {
    title: "MAINS",
    items: [
      { name: "Flat Iron Steak, Chimichurri", description: "sliced", price: "£22" },
      { name: "Half Roast Chicken, Garlic & Lemon", price: "£18" },
      { name: "Iberico Pork Chop, Apple & Mustard", description: "sliced", price: "£28" },
      { name: "Miso Glazed Salmon, Sesame Greens", price: "£28" },
      { name: "Wood Oven Gnocchi, Wild Mushrooms, Parmesan", price: "£20" }
    ]
  },
  {
    title: "SIDES",
    items: [
      { name: "Rosemary Fries", price: "£5" },
      { name: "Wood Oven Potatoes", price: "£6" },
      { name: "Charred Corn, Chilli Butter", price: "£5" },
      { name: "Kimchi Slaw", price: "£5" }
    ]
  },
  {
    title: "DESSERTS",
    items: [
      { name: "Churros & Chocolate", price: "£6" },
      { name: "Wood Oven Brownie, Vanilla Ice Cream", price: "£7" },
      { name: "Polenta & Orange Cake", price: "£5" }
    ]
  },
  {
    title: "PRE-BUILT (PER HEAD)",
    items: [
      { name: "Pizza & Small Plates", description: "Mixed pizzas, pork belly, karaage chicken, squid, aubergine, fries, corn, slaw, churros.", price: "£28pp" },
      { name: "The Big Grill", description: "Steak, chicken, pork, salmon, gnocchi, potatoes, greens, slaw, brownies.", price: "£36pp" },
      { name: "The Roast (Sundays Only)", description: "Beef, chicken, roast of the week, all trimmings, apple pie, jam roly poly.", price: "£32pp" },
      { name: "The Hideout All-In", description: "A bit of everything — pizzas, small plates, grill mains, sides, and a mix of desserts.", price: "£40pp" }
    ]
  },

  // The Halls - Events Menu
  {
    title: "Deli Style — Meetings & Conference Lunch",
    items: [
      {
        name: "Taken from the Café menu. Delivered as platters, bowls, boxes. Charged per head.",
        description: ""
      }
    ]
  },
  {
    title: "Sandwiches (Choose Three)",
    items: [
      { name: "Italian Deli", description: "salami, mortadella, provolone, pickles, ciabatta" },
      { name: "Reuben", description: "salt beef, sauerkraut, Swiss cheese, Russian dressing, rye" },
      { name: "Caprese", description: "buffalo mozzarella, heritage tomato, basil, focaccia" },
      { name: "The Med", description: "roast vegetables, hummus, feta, ciabatta" },
      { name: "Roast Chicken Caesar", description: "chicken, anchovy mayo, parmesan, cos lettuce, sourdough" }
    ]
  },
  {
    title: "Salads (Choose Three)",
    items: [
      { name: "Roast Cauliflower, Tahini, Pomegranate" },
      { name: "Freekeh & Squash Grain Salad" },
      { name: "Charred Broccoli & Almond" },
      { name: "Heritage Tomato & Burrata" },
      { name: "Sesame Soba Noodles" }
    ]
  },
  {
    title: "Sweets (Choose Two)",
    items: [
      { name: "Polenta & Orange Cake" },
      { name: "Pistachio & Rose Cake" },
      { name: "Chocolate Babka" },
      { name: "Date & Walnut Slice" }
    ]
  },
  {
    title: "Deli Style Pricing",
    items: [
      {
        name: "Price: £22 per head",
        description: ""
      }
    ]
  },
  {
    title: "Plated Three Course",
    items: [
      {
        name: "Organiser selects 3 starters, 3 mains, 3 desserts. Guests pre-order. Individually priced, spend builds per guest.",
        description: ""
      }
    ]
  },
  {
    title: "Starters",
    items: [
      { name: "Charred Octopus, Potato, Aioli", price: "£12" },
      { name: "Beef Short Rib Croquettes", price: "£10" },
      { name: "Wood-Roast Aubergine, Miso Glaze", price: "£9" },
      { name: "Crispy Squid, Lemon, Seaweed Salt", price: "£11" },
      { name: "Heritage Tomato & Burrata", price: "£10" },
      { name: "Roast Beetroot, Whipped Goat's Cheese, Walnuts", price: "£9" },
      { name: "Karaage Fried Chicken, Yuzu Mayo", price: "£9" },
      { name: "Chorizo al Vino", price: "£8" }
    ]
  },
  {
    title: "Mains",
    items: [
      { name: "Ribeye Steak, Smoked Shallot", price: "£36" },
      { name: "Roast Cod, Brown Shrimp Butter", price: "£26" },
      { name: "Braised Beef Short Rib, Mash, Charred Carrot", price: "£24" },
      { name: "Miso Glazed Salmon, Sesame Greens", price: "£28" },
      { name: "Iberico Pork Chop, Apple & Mustard", price: "£28" },
      { name: "Wood Oven Gnocchi, Mushrooms, Parmesan", price: "£20" },
      { name: "Confit Duck Leg, White Beans & Sausage", price: "£22" },
      { name: "Charred Aubergine, Tahini & Pomegranate", price: "£18" }
    ]
  },
  {
    title: "Desserts",
    items: [
      { name: "Basque Cheesecake, Burnt Top", price: "£9" },
      { name: "Wood Oven Brownie, Vanilla Ice Cream", price: "£9" },
      { name: "Churros, Dark Chocolate", price: "£8" },
      { name: "Sticky Toffee Pudding, Salted Caramel", price: "£9" },
      { name: "Apple Pie & Custard", price: "£7" },
      { name: "Lemon Tart, Crème Fraîche", price: "£8" },
      { name: "Jam Roly Poly & Custard", price: "£7" },
      { name: "Bread & Butter Pudding", price: "£7" }
    ]
  },
  {
    title: "Feast Style — Served Down The Table",
    items: [
      {
        name: "Boards of starters, mains and desserts. Big, social, abundant. Priced per head.",
        description: ""
      },
      {
        name: "The Common Table — £35pp",
        description: ""
      },
      { name: "Starters", description: "Padron Peppers, Jamón Croquetas, Whipped Cod Roe, Flatbread" },
      { name: "Mains", description: "Half Roast Chickens, Flat Iron Steak, Charred Broccoli & Almond, Roast Potatoes" },
      { name: "Desserts", description: "Churros & Chocolate, Wood Oven Brownie" },
      {
        name: "The Boards — £50pp",
        description: ""
      },
      { name: "Starters", description: "Crispy Squid, Karaage Chicken, Aubergine with Miso, Heritage Tomato & Burrata" },
      { name: "Mains", description: "Iberico Pork Chops, Miso Salmon, Wood Oven Gnocchi, Seasonal Greens, Fries" },
      { name: "Desserts", description: "Basque Cheesecake, Sticky Toffee Pudding, Lemon Tart" },
      {
        name: "The Feast — £70pp",
        description: ""
      },
      { name: "Starters", description: "Octopus & Aioli, Lamb Chops, Roast Beetroot & Goat's Cheese, Charred Cauliflower Salad" },
      { name: "Mains", description: "Ribeye Steak, Whole Seabass, Confit Duck, Charred Aubergine with Tahini" },
      { name: "Desserts", description: "Apple Pie & Custard, Treacle Sponge, Polenta & Orange Cake, Artisan Cheese Board" }
    ]
  },
  {
    title: "Bespoke Events",
    items: [
      {
        name: "Bespoke curated party and event food available. We're here to deliver, we love a challenge.",
        description: ""
      }
    ]
  }
];