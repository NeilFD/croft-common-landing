export interface MenuItem {
  name: string;
  price?: string;
  description?: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const cafeMenu: MenuSection[] = [
  {
    title: "COFFEE",
    items: [
      { name: "Flat White", price: "2.8" },
      { name: "Long Black", price: "2.6" },
      { name: "Iced Filter", price: "3.0" },
      { name: "Cortado", price: "2.8" },
      { name: "Batch Brew", price: "2.4" },
      { name: "Cold Brew", price: "3.2" },
      { name: "Oat, soy, almond", description: "add 0.5" },
      { name: "Extra shot", description: "0.5" },
    ]
  },
  {
    title: "PASTRIES",
    items: [
      { name: "Butter Croissant", price: "2.6" },
      { name: "Almond Thing", price: "3.0" },
      { name: "Dirty Chocolate Cookie", price: "2.8" },
      { name: "Banana Bread, Warm", price: "3.2" },
    ]
  },
  {
    title: "QUICHE",
    items: [
      { name: "Spinach & Feta Quiche", price: "6.0" },
      { name: "Leek & Gruyère Quiche", price: "6.5" },
      { name: "Ham, Egg, Mustard Quiche", price: "6.5" },
      { name: "Served cold. Eat warm.", description: "" },
    ]
  },
  {
    title: "SALADS",
    items: [
      { name: "Roast Beet, Whipped Feta, Hazelnut", price: "8.0" },
      { name: "Cauli, Curry Mayo, Coriander, Seeds", price: "8.5" },
      { name: "Grains, Greens, Citrus", price: "7.5" },
      { name: "Add Chicken", description: "3.5" },
      { name: "Add Hot Egg", description: "1.5" },
    ]
  },
  {
    title: "SANDWICHES",
    items: [
      { name: "Toastie: Cheese, Onion, Mustard", price: "7.5" },
      { name: "Ciabatta: Mortadella, Pickles", price: "8.0" },
      { name: "Focaccia: Tomatoes, Pesto, Mozz", price: "7.0" },
    ]
  }
];

export const cocktailMenu: MenuSection[] = [
  {
    title: "HOME CLASSICS",
    items: [
      { name: "Negroni", description: "No garnish, no chat", price: "9" },
      { name: "Martini", description: "Wet, Dirty, You Choose", price: "11" },
      { name: "Margarita", description: "Short, Sharp, Salty", price: "9" },
      { name: "Old Fashioned", description: "Built slow, stirred hard", price: "10" },
    ]
  },
  {
    title: "HOUSE TWISTS",
    items: [
      { name: "Bitter Lemon Spritz", description: "Campari, Lemon, Bubble", price: "9" },
      { name: "Gin Basil Slap", description: "Green, Clean, Cold", price: "10" },
      { name: "Smoked Paloma", description: "Mezcal, Grapefruit, Fire", price: "11" },
      { name: "Croft Club", description: "Vodka, Raspberry, Foam", price: "10" },
    ]
  },
  {
    title: "PLAYING AWAY",
    items: [
      { name: "Yuzu Daiquiri", description: "Sour, Bright, Sharp", price: "10" },
      { name: "Tamarind Mule", description: "Dark, Spiced, Tangy", price: "9" },
      { name: "Thai Negroni", description: "Lemongrass, Red, Slow", price: "11" },
      { name: "Black Sesame Sour", description: "Creamy, Nutty, Boozy", price: "10" },
    ]
  }
];

export const beerMenu: MenuSection[] = [
  {
    title: "DRAUGHT - LOCAL ONLY",
    items: [
      { name: "Left Handed Giant - Sky Above (Pale Ale)", description: "4.5%", price: "6.0" },
      { name: "Left Handed Giant - Dream House (IPA)", description: "6.2%", price: "7.0" },
      { name: "Left Handed Giant - West Coast Pils", description: "5.0%", price: "6.5" },
      { name: "Wiper & True - Kaleidoscope (Pale Ale)", description: "4.2%", price: "6.0" },
      { name: "Wiper & True - Milkshake Porter", description: "5.3%", price: "6.5" },
      { name: "Lost & Grounded - Keller Pils", description: "4.8%", price: "6.0" },
      { name: "Lost & Grounded - Apophenia (Tripel)", description: "8.8%", price: "7.5" },
      { name: "Bristol Beer Factory - Southville Hop IPA", description: "6.5%", price: "7.0" },
      { name: "Bristol Beer Factory - Milk Stout", description: "4.5%", price: "6.0" },
      { name: "LHG - Infinite Days IPA", description: "6.5%", price: "7.0" },
      { name: "LHG - Ready, Set, Go!", description: "6.5%", price: "7.0" },
      { name: "LHG - Twin Cities (GF Pale Ale)", description: "5.5%", price: "6.5" },
      { name: "Twelve lines. Rotating. Pints or halves. Cold only.", description: "" },
    ]
  },
  {
    title: "IN CANS",
    items: [
      { name: "More from above. Plus guest sours, strong things, and hoppy weirdos.", description: "" },
    ]
  },
  {
    title: "BEER FOOD",
    items: [
      { name: "Dirty Nachos", description: "Cheese, Jalapeño, Salsa", price: "7.5" },
      { name: "Wings", description: "Hot, Sticky, Scattered Seeds", price: "8.5" },
      { name: "Giant Pretzel", description: "Beer Cheese Dip", price: "6.0" },
      { name: "Loaded Fries", description: "Bacon, Onion, Ranch", price: "7.5" },
      { name: "Pickled Eggs", description: "Punchy little bastards", price: "2.0" },
    ]
  }
];

export const kitchensMenu: MenuSection[] = [
  {
    title: "PIZZA - WOOD-FIRED",
    items: [
      { name: "Margherita", price: "8" },
      { name: "Hot Honey & Goat Cheese", price: "10" },
      { name: "Nduja & Ricotta", price: "11" },
      { name: "Anchovy, Olive, Caper", price: "10" },
      { name: "Mushroom, Sage, Taleggio", price: "11" },
      { name: "Add Burrata", description: "3" },
    ]
  },
  {
    title: "WOOD-FIRED MAINS",
    items: [
      { name: "Whole Cauliflower, Harissa & Tahini", price: "12" },
      { name: "Flat Iron Steak, Chimichurri", price: "14" },
      { name: "Wood-roasted Chicken Thighs, Herbs", price: "13" },
      { name: "Smoked Salmon Fillet, Dill Cream", price: "15" },
      { name: "Maple Pork Belly, Apple Slaw", price: "14" },
      { name: "Charred Corn, Lime Mayo", price: "6" },
    ]
  },
  {
    title: "GRILL",
    items: [
      { name: "Bavette, Rare", price: "14" },
      { name: "Ribeye, 30-day", price: "18" },
      { name: "Flat Iron, Chimichurri", price: "15" },
      { name: "Lamb Rump, Harissa", price: "17" },
      { name: "Pork Chop, Apple Slaw", price: "16" },
      { name: "Half Chicken, Charred Lemon", price: "14" },
      { name: "Grilled Halloumi, Salsa Verde", price: "12" },
      { name: "Whole Seabream, Chilli Butter", price: "18" },
      { name: "BBQ Jackfruit Skewer, Mint Yogurt", price: "11" },
    ]
  },
  {
    title: "SIDES",
    items: [
      { name: "Chips", price: "3" },
      { name: "Parmesan Fries", price: "4" },
      { name: "Bone Marrow Butter", price: "2" },
      { name: "Onion Rings", price: "4" },
      { name: "Grilled Tenderstem", price: "4" },
      { name: "Side Salad", price: "3" },
      { name: "Flatbread", price: "2" },
    ]
  },
  {
    title: "MEXICAN",
    items: [
      { name: "Tacos (2 per order):", description: "" },
      { name: "Beef Barbacoa", price: "9" },
      { name: "Chicken Mole", price: "9" },
      { name: "Carnitas, Salsa Roja", price: "9" },
      { name: "Sweet Potato, Salsa Verde", price: "8" },
      { name: "Fish Tempura, Chipotle Mayo", price: "10" },
      { name: "Jackfruit, Lime Crema", price: "8" },
      { name: "Quesadilla, Cheese Pull", price: "7" },
      { name: "Chorizo Quesadilla", price: "8" },
      { name: "Elote, Lime Mayo", price: "4" },
      { name: "Tortilla Chips & Guac", price: "5" },
      { name: "Refried Beans, Cotija", price: "4" },
      { name: "Crispy Pork Skin w/ Hot Sauce", price: "5" },
      { name: "Mexican Rice Bowl, Pickles", price: "9" },
      { name: "Charred Corn Salad", price: "6" },
      { name: "Tostadas - Crab, Avocado", price: "10" },
    ]
  },
  {
    title: "ASIAN STREET FOOD",
    items: [
      { name: "BAO BUNS", description: "" },
      { name: "Pork Belly, Pickles", price: "8" },
      { name: "Fried Tofu, Sweet Soy", price: "7" },
      { name: "Korean Chicken, Gochujang", price: "8" },
      { name: "Shiitake, Black Garlic Mayo", price: "7" },
      { name: "NOODLES", description: "" },
      { name: "Chilli Garlic Ramen, Soft Egg", price: "10" },
      { name: "Beef Brisket Pho", price: "11" },
      { name: "Miso Udon, Crispy Tofu", price: "9" },
      { name: "Dan Dan Noodles, Pork & Peanut", price: "10" },
      { name: "RICE & MAINS", description: "" },
      { name: "Karaage Chicken Bowl", price: "9" },
      { name: "Tofu & Aubergine Mapo", price: "9" },
      { name: "Sticky Pork Belly, Greens", price: "10" },
      { name: "Beef Bulgogi, Kimchi", price: "11" },
      { name: "Thai Green Curry, Jasmine Rice", price: "10" },
      { name: "Soy Braised Mushrooms", price: "9" },
      { name: "SMALL PLATES", description: "" },
      { name: "Gyoza, Ponzu Dip", price: "6" },
      { name: "Prawn Toast, Sweet Chilli", price: "6" },
      { name: "Edamame, Chilli Salt", price: "4" },
      { name: "Chilli Broccoli", price: "7" },
      { name: "Kimchi", price: "3" },
      { name: "Prawn Crackers, Dust & Dip", price: "3" },
      { name: "Satay Chicken Skewers", price: "7" },
      { name: "Miso Aubergine, Spring Onion", price: "6" },
    ]
  }
];