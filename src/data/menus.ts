export interface MenuItem {
  name: string;
  price: string;
  desc?: string;
  variant?: string;
}

export interface MenuSection {
  title: string;
  subtitle?: string;
  items?: MenuItem[];
  layout?: "single" | "two-col" | "grid";
  note?: string;
}

export interface Menu {
  eyebrow: string;
  title: string;
  subtitle?: string;
  sections: MenuSection[];
  footer?: string;
}

/* ───────────── Town · The Black Bear ───────────── */

export const blackBearMenu: Menu = {
  eyebrow: "The Crazy Bear",
  title: "The Black Bear",
  subtitle: "Fine dining",
  sections: [
    {
      title: "Small Plates",
      items: [
        { name: "Lamb Scrumpets", price: "12", desc: "anchovy" },
        { name: "Crab Salad", price: "13", desc: "crumpet, radish" },
        { name: "Rock Oyster", price: "13", desc: "shallot, chardonnay vinegar" },
        { name: "Beef Tartare Tartlet", price: "14" },
        { name: "Heritage Beetroot (v)", price: "11", desc: "whipped goat curd, walnut" },
      ],
    },
    {
      title: "Starters",
      items: [
        { name: "Orkney Scallop", price: "20", desc: "tomato essence, sorrel" },
        { name: "Gin Cured Sea Trout", price: "18", desc: "buttermilk, dill" },
        { name: "Venison Carpaccio", price: "18", desc: "turnip, caper" },
        { name: "Hay Smoked Mackerel", price: "16", desc: "grapefruit, watercress" },
        { name: "Roasted Bone Marrow", price: "14", desc: "parsley & shallot salad" },
        { name: "Charred Hispi Cabbage (vg)", price: "14", desc: "hazelnut, smoked oil, lovage" },
      ],
    },
    {
      title: "Mains",
      items: [
        { name: "Duck Breast", price: "32", desc: "beetroot, cavolo nero" },
        { name: "Short Rib of Beef", price: "35", desc: "horseradish, carrot" },
        { name: "Turbot", price: "38", desc: "braised oxtail, roasted cep" },
        { name: "Cod", price: "36", desc: "warm hollandaise, young leeks, tempura" },
        { name: "Rack of Lamb", price: "42", desc: "black garlic, confit tomato" },
        { name: "Roasted Celeriac (vg)", price: "28", desc: "truffle, salt-baked turnip, wild mushroom" },
      ],
    },
    {
      title: "Sides",
      layout: "grid",
      items: [
        { name: "Lyonnaise Potato", price: "8" },
        { name: "Mixed Leaf Salad", price: "8", desc: "pickled shallots" },
        { name: "Baby Gem Caesar", price: "8", desc: "Old Winchester" },
        { name: "Tenderstem Broccoli", price: "8", desc: "chilli & garlic butter" },
      ],
    },
    {
      title: "Pudding",
      items: [
        { name: "Amalfi Lemon Tart", price: "14", desc: "raspberry sorbet" },
        { name: "Tart of Strawberries", price: "14", desc: "almond, yogurt, Earl Grey" },
        { name: "Mille-Feuille", price: "14", desc: "milk chocolate, blackberry, mint" },
        { name: "Peach Melba", price: "14", desc: "green tea, basil, meringue" },
        { name: "Pistachio Sponge", price: "14", desc: "dark chocolate, cardamom" },
        { name: "Dark Chocolate Delice (vg)", price: "14", desc: "olive oil, sea salt, raspberry" },
      ],
    },
    {
      title: "Cheese",
      note: "Please ask your server for today's selection",
    },
  ],
  footer:
    "Please inform your server of any allergies or dietary requirements. Prices include VAT. A discretionary 12.5% service charge will be added to tables of 6 or more.",
};

/* ───────────── Town · B&B ───────────── */

export const bnbMenu: Menu = {
  eyebrow: "The Crazy Bear",
  title: "B&B",
  subtitle: "Brasserie",
  sections: [
    {
      title: "Small Plates",
      items: [
        { name: "Focaccia", price: "6", desc: "olive oil" },
        { name: "Chips & Dip", price: "8", desc: "trout rillettes, game chips" },
        { name: "Wild Garlic Houmous", price: "9", desc: "za'atar" },
        { name: "Cod Croquettes", price: "10", desc: "sauce gribiche" },
        { name: "Padron Peppers (vg)", price: "7", desc: "sea salt, lemon" },
      ],
    },
    {
      title: "Starters",
      items: [
        { name: "Creamed Cauliflower & Cheddar Soup", price: "9" },
        { name: "Chicory & Orange Salad", price: "10", desc: "Stilton, walnut, bitter leaves" },
        { name: "Country Pate", price: "11", desc: "house pickles, grilled sourdough" },
        { name: "Smoked Salmon", price: "12", desc: "capers, creme fraiche" },
        { name: "Burrata", price: "14", desc: "courgette salad, pickled lemon" },
        { name: "Heritage Tomato Tart (vg)", price: "11", desc: "basil oil, pine nut, balsamic" },
      ],
    },
    {
      title: "Mains",
      items: [
        { name: "Spaghetti", price: "19", desc: "olive oil, datterini tomato" },
        { name: "Sausage & Mash", price: "20" },
        { name: "Chicken Breast", price: "22", desc: "Alsace bacon, leeks, morel cream" },
        { name: "Mussels", price: "23", desc: "frites, sourdough" },
        { name: "Confit Duck Leg", price: "24", desc: "braised lentils, pickled red onion" },
        { name: "Flat Iron Steak", price: "25", desc: "peppercorn sauce" },
        { name: "Wild Mushroom Risotto (v)", price: "19", desc: "aged Parmesan, truffle oil, chive" },
      ],
    },
    {
      title: "Sides",
      layout: "grid",
      items: [
        { name: "Skin On Fries", price: "6" },
        { name: "Mixed Leaf Salad", price: "6", desc: "pickled shallots" },
        { name: "Baby Gem Caesar", price: "6", desc: "Old Winchester" },
        { name: "Tenderstem Broccoli", price: "6", desc: "chilli & garlic butter" },
      ],
    },
    {
      title: "Pudding",
      layout: "grid",
      items: [
        { name: "Knickerbocker Glory", price: "8" },
        { name: "Strawberry Eton Mess", price: "8" },
        { name: "Lemon Posset", price: "8", desc: "shortbread" },
        { name: "Basque Style Cheesecake", price: "8", desc: "seasonal fruit" },
        { name: "Coconut Panna Cotta (vg)", price: "8", desc: "macerated berries, mint" },
      ],
    },
    {
      title: "Cheese",
      note: "Please ask your server for today's selection",
    },
  ],
  footer:
    "Please inform your server of any allergies or dietary requirements. Prices include VAT. A discretionary 12.5% service charge will be added to tables of 6 or more.",
};

/* ───────────── Country · Pub ───────────── */

export const countryPubMenu: Menu = {
  eyebrow: "The Crazy Bear",
  title: "The Pub",
  subtitle: "Pub  ·  Wok",
  sections: [
    {
      title: "To Start",
      layout: "two-col",
      items: [
        { name: "Scotch Egg", price: "8", desc: "nam jim jaew" },
        { name: "Sausage Roll", price: "7", desc: "smoked chilli jam" },
        { name: "Prawn Crackers", price: "5", desc: "sweet chilli, pickled garlic" },
        { name: "Crispy Wings", price: "9", desc: "tamarind glaze, sesame" },
        { name: "Padron Peppers", price: "6", desc: "sea salt, lime" },
        { name: "Pork Scratchings", price: "5", desc: "apple sauce" },
        { name: "Crispy Tofu Bites (vg)", price: "7", desc: "sweet chilli, lime, coriander" },
      ],
    },
    {
      title: "The Pub",
      items: [
        { name: "Potted Brown Shrimp", price: "10", desc: "mace butter, sourdough" },
        { name: "Ham Hock & Piccalilli", price: "11", desc: "grilled bread" },
        { name: "Roast Bone Marrow", price: "13", desc: "parsley, capers, sourdough" },
        { name: "Devilled Lamb Kidneys", price: "17", desc: "sourdough, watercress, anchovy butter" },
        { name: "Smoked Haddock", price: "19", desc: "grain mustard cream, poached egg, chives" },
        { name: "Braised Ox Cheek", price: "22", desc: "horseradish, bone marrow crumb, greens" },
        { name: "Slow-Roast Pork Shoulder", price: "20", desc: "crackling, burnt apple, cavolo nero" },
        { name: "Bavette Steak", price: "26", desc: "dripping chips, bearnaise" },
        { name: "Wild Mushroom & Ale Pie (v)", price: "18", desc: "shortcrust, mash, buttered greens" },
      ],
    },
    {
      title: "The Wok",
      items: [
        { name: "Tom Kha", price: "10", desc: "chicken, coconut, galangal, crispy shallot" },
        { name: "Tom Yum", price: "12", desc: "tiger prawn, chilli oil, lime leaf" },
        { name: "Som Tam", price: "11", desc: "green papaya, dried shrimp, peanut, lime" },
        { name: "Laab Lettuce Cups", price: "10", desc: "pork, mint, toasted rice, bird's eye" },
        { name: "Pad Thai", price: "16 / 18", desc: "tamarind, peanut, beansprout, lime", variant: "chicken · veg | prawn" },
        { name: "Green Curry", price: "17 / 19", desc: "Thai aubergine, bamboo, sweet basil", variant: "chicken · veg | beef" },
        { name: "Jungle Curry", price: "18", desc: "pork, green peppercorn, wild ginger, chilli" },
        { name: "Pad Krapow", price: "17", desc: "holy basil, bird's eye chilli, fried egg" },
        { name: "Whole Seabass", price: "22", desc: "three-flavour sauce, lime, chilli, garlic" },
        { name: "Massaman Tofu & Sweet Potato (vg)", price: "16", desc: "peanut, tamarind, crispy shallot, roti" },
      ],
    },
    {
      title: "Best of Both",
      items: [
        { name: "Beef Shin Massaman Pie", price: "22", desc: "flaky pastry, roti, pickled cucumber" },
        { name: "Crispy Pork Belly", price: "21", desc: "tamarind caramel, apple slaw" },
        { name: "Grilled Flat Iron", price: "24", desc: "nam jim, watercress, shallot" },
        { name: "Roast Duck", price: "23", desc: "five spice, plum, crispy shallots, pak choi" },
        { name: "Lamb Shank Penang", price: "23", desc: "slow-braised, penang curry, crispy garlic, roti" },
        { name: "Charred Cauliflower Steak (vg)", price: "18", desc: "nam jim jaew, herb salad, crispy rice" },
      ],
    },
    {
      title: "On the Side",
      layout: "grid",
      items: [
        { name: "Triple-Cooked Chips", price: "6" },
        { name: "Chips, Curry Sauce", price: "7" },
        { name: "Creamed Potato", price: "6" },
        { name: "Buttered Greens", price: "6" },
        { name: "Jasmine Rice", price: "5" },
        { name: "Coconut Rice", price: "6" },
        { name: "Roti", price: "5" },
        { name: "Som Tam", price: "7" },
      ],
    },
    {
      title: "Afters",
      layout: "two-col",
      items: [
        { name: "Sticky Toffee Pudding", price: "9", desc: "palm sugar caramel, clotted cream" },
        { name: "Treacle Tart", price: "9", desc: "vanilla ice cream" },
        { name: "Mango Sticky Rice", price: "9", desc: "coconut cream, toasted sesame" },
        { name: "Banana Fritters", price: "8", desc: "pandan custard, lime zest" },
        { name: "Chocolate Brownie", price: "9", desc: "salted coconut ice cream" },
        { name: "Coconut & Lime Sorbet (vg)", price: "7", desc: "kaffir lime, toasted coconut" },
      ],
    },
    {
      title: "Cheese",
      note: "British Farmhouse Selection · 3 cheeses £14 · 5 cheeses £20\nMontgomery Cheddar · Colston Bassett Stilton · Baron Bigod · Tunworth · Cornish Yarg · Ragstone\nOatcakes, quince, honeycomb · nam prik num · pickled bird's eye chilli · tamarind & date chutney · crispy shallots",
    },
  ],
  footer:
    "Please inform your server of any allergies or dietary requirements. Prices include VAT. A discretionary 12.5% service charge will be added to tables of 6 or more.",
};
