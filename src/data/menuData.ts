export interface MenuItem {
  name: string;
  price?: string;
  description?: string;
  isEmail?: boolean;
  isLink?: boolean;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const cafeMenu: MenuSection[] = [
  {
    title: "COFFEE",
    items: [
      { name: "Flat White", price: "3.8" },
      { name: "Long Black", price: "3.6" },
      { name: "Iced Filter", price: "4.0" },
      { name: "Cortado", price: "3.8" },
      { name: "Batch Brew", price: "3.4" },
      { name: "Cold Brew", price: "4.2" },
      { name: "Oat, soy, almond", description: "add 0.5" },
      { name: "Extra shot", description: "0.5" },
    ]
  },
  {
    title: "PASTRIES",
    items: [
      { name: "Butter Croissant", price: "3.6" },
      { name: "Almond", price: "4.0" },
      { name: "Dirty Chocolate Cookie", price: "3.8" },
      { name: "Banana Bread, Warm", price: "4.2" },
    ]
  },
  {
    title: "QUICHE",
    items: [
      { name: "Spinach & Feta Quiche", price: "7.5" },
      { name: "Leek & Gruyère Quiche", price: "8.0" },
      { name: "Ham, Egg, Mustard Quiche", price: "8.0" },
      { name: "Served cold. Eat warm.", description: "" },
    ]
  },
  {
    title: "SALADS",
    items: [
      { name: "Roast Beet, Whipped Feta, Hazelnut", price: "10.0" },
      { name: "Cauli, Curry Mayo, Coriander, Seeds", price: "10.5" },
      { name: "Grains, Greens, Citrus", price: "9.5" },
      { name: "Add Chicken", description: "4.0" },
      { name: "Add Hot Egg", description: "2.0" },
    ]
  },
  {
    title: "SANDWICHES",
    items: [
      { name: "Toastie: Cheese, Onion, Mustard", price: "9.0" },
      { name: "Ciabatta: Mortadella, Pickles", price: "9.5" },
      { name: "Focaccia: Tomatoes, Pesto, Mozz", price: "8.5" },
    ]
  }
];

export const cocktailMenu: MenuSection[] = [
  {
    title: "HOME CLASSICS",
    items: [
      { name: "Negroni", description: "Simple garnish, no chat", price: "9" },
      { name: "Martini", description: "Wet, Dirty, You Choose", price: "11" },
      { name: "Margarita", description: "Short, Sharp, Salty", price: "9" },
      { name: "Old Fashioned", description: "Built slow, stirred hard", price: "10" },
    ]
  },
  {
    title: "HOUSE TWISTS",
    items: [
      { name: "Bitter Lemon Spritz", description: "Campari, Lemon, Bubbles", price: "9" },
      { name: "Gin Basil Slap", description: "Green, Clean, Cold", price: "10" },
      { name: "Smoked Paloma", description: "Mezcal, Grapefruit, Fire", price: "11" },
      { name: "Croft Club", description: "Vodka, Raspberry, Foam", price: "10" },
    ]
  },
  {
    title: "PLAYING AWAY",
    items: [
      { name: "Yuzu Daiquiri", description: "Sour, Bright, Sharp", price: "10" },
      { name: "Tamarind Mule", description: "Dark, Spiced, Deep", price: "9" },
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
      { name: "Dirty Nachos", description: "Cheese, Jalapeño, Salsa", price: "11.5" },
      { name: "Wings", description: "Hot, Sticky, Scattered Seeds", price: "8.5" },
      { name: "Giant Pretzel", description: "Beer Cheese Dip", price: "8.0" },
      { name: "Loaded Fries", description: "Bacon, Onion, Ranch", price: "9.5" },
      { name: "Pickled Eggs", description: "Punchy little bastards", price: "4.0" },
      { name: "French Dip", description: "Gruyere Cheese", price: "11.5" },
      { name: "Pork Scratchings", description: "Salty, crunchy, proper", price: "5.0" },
      { name: "Chilli Cheese Dogs", description: "Smoky beans, melted cheese", price: "8.5" },
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
      { name: "Porchetta Roll, Sage Apricots", price: "14" },
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
      { name: "TACOS (2 per order)", description: "" },
      { name: "Beef Barbacoa", price: "9" },
      { name: "Chicken Mole", price: "9" },
      { name: "Carnitas, Salsa Roja", price: "9" },
      { name: "Sweet Potato, Salsa Verde", price: "8" },
      { name: "Fish Tempura, Chipotle Mayo", price: "10" },
      { name: "Jackfruit, Lime Crema", price: "8" },
    ]
  },
  {
    title: "QUESADILLAS & MAINS",
    items: [
      { name: "Quesadilla, Cheese Pull", price: "7" },
      { name: "Chorizo Quesadilla", price: "8" },
      { name: "Mexican Rice Bowl, Pickles", price: "9" },
      { name: "Tostadas - Crab, Avocado", price: "10" },
    ]
  },
  {
    title: "MEXICAN SIDES",
    items: [
      { name: "Elote, Lime Mayo", price: "4" },
      { name: "Tortilla Chips & Guac", price: "5" },
      { name: "Refried Beans, Cotija", price: "4" },
      { name: "Crispy Pork Skin w/ Hot Sauce", price: "5" },
      { name: "Charred Corn Salad", price: "6" },
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
    ]
  },
  {
    title: "NOODLES",
    items: [
      { name: "Chilli Garlic Ramen, Soft Egg", price: "10" },
      { name: "Beef Brisket Pho", price: "11" },
      { name: "Miso Udon, Crispy Tofu", price: "9" },
      { name: "Dan Dan Noodles, Pork & Peanut", price: "10" },
    ]
  },
  {
    title: "RICE & MAINS",
    items: [
      { name: "Karaage Chicken Bowl", price: "9" },
      { name: "Tofu & Aubergine Mapo", price: "9" },
      { name: "Sticky Pork Belly, Greens", price: "10" },
      { name: "Beef Bulgogi, Kimchi", price: "11" },
      { name: "Thai Green Curry, Jasmine Rice", price: "10" },
      { name: "Soy Braised Mushrooms", price: "9" },
    ]
  },
  {
    title: "ASIAN SMALL PLATES",
    items: [
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

const homeMenu: MenuSection[] = [
  {
    title: "CROFT COMMON",
    items: [
      { 
        name: "A café that opens early and never hurries you out. Black coffee. Warm light. Pastries warm. Quiet tables. Open laptops. The street starts to stir. Outside, the pavement terrace catches the sun. It's slow, it's simple, and it's yours for as long as you want it.", 
        description: ""
      },
      { 
        name: "At five, the bar takes its turn. Lights dip. Bottles line up. The terrace opens up, Bristol smiles. Glass in hand, sky above. Inside, low-lit and close. House twists, sharp pours, clean finishes. Not loud. Never quiet.", 
        description: ""
      },
      { 
        name: "Across the floor, the beer hall kicks in. Long tables. Cold pints. Twelve taps, all Bristol. Cans in the fridge. Friends at full volume. The rooftop terrace rises - open air, opened up, open late.", 
        description: ""
      },
      { 
        name: "Four kitchens. One pass. Wood-fired, grilled, tossed, charred. Pizza w/ blistered crusts. Flat iron steaks. Pork belly tacos. Chilli noodle bowls. Something new, something messy, something always worth sharing.", 
        description: ""
      },
      { 
        name: "Wedding, rave, launch, together.", 
        description: ""
      },
      { 
        name: "This is Croft Common. Shared space. Common ground. One roof. Built on community.", 
        description: ""
      }
    ]
  }
];

const hallMenu: MenuSection[] = [
  {
    title: "HALLS",
    items: [
      { 
        name: "Blank walls. High ceilings. Concrete, light, power.", 
        description: ""
      },
      { 
        name: "Build it up. Strip it back. Wedding, rave, launch, together.", 
        description: ""
      },
      { 
        name: "No presets. No packages. Just space, sound, and possibility.", 
        description: ""
      },
      { 
        name: "Formal or feral. Intimate or industrial.", 
        description: ""
      },
      { 
        name: "We shape to fit. You lead, we follow.", 
        description: ""
      },
      { 
        name: "Whatever the vision, we'll make it work.", 
        description: ""
      },
      { 
        name: "£: POA", 
        description: ""
      },
      { 
        name: "hey@croftcommon.com", 
        description: "",
        isEmail: true
      }
    ]
  }
];

// Community Menu Data
const communityMenuData: MenuSection[] = [
  {
    title: "COMMUNITY",
    items: [
      { 
        name: "We're here because of this place. This building. This street. This city. So we give back, not just lip service.<br><br>We stock local. We hire local. We pay fair. We build shifts that work for real lives. We open our doors to good causes and community groups - sometimes for hire, often for free.<br><br>We believe space should be shared as well as sold. That hospitality can have roots, not just margins.<br><br>Croft Common is for everyone. Common Ground for all. It's built to add, never subtract.<br><br>Questions/Queries/Requests/Ideas we're ready for you.<br><br><a href='mailto:community@croftcommon.com' class='text-foreground hover:accent-electric-blue hover:underline transition-all duration-300'>community@croftcommon.com</a>", 
        description: ""
      }
    ]
  }
];

// Common Room Menu Data
const commonRoomMenuData: MenuSection[] = [
  {
    title: "What's Next?",
    items: [
      { 
        name: "Gigs, talks, tastings, all sorts.", 
        description: "The calendar never sits still. From low-key launches to big, messy nights — this is where it lands first. Some tickets sell out in hours. Some don't go public at all. You're already on the list."
      },
      { 
        name: "<strong>Take a look</strong>", 
        description: "",
        isLink: true
      }
    ]
  },
  {
    title: "Common People",
    items: [
      { 
        name: "The crew behind the counter. And the ones who keep coming back.", 
        description: "We back local. We back talent. We back people doing it right. Members get first dibs on workshops, collabs, and pop-ups from the makers, growers, shakers and pourers we rate. Come learn. Come try. Come talk."
      },
      { 
        name: "<strong>Meet</strong>", 
        description: "",
        isLink: true
      }
    ]
  },
  {
    title: "Common Good",
    items: [
      { 
        name: "We give space. You give time. That's the deal.", 
        description: "We hand the Hall to causes that matter. If you're part of one — or want to help one — this is where you step in. No hashtags. No speeches. Just action. Real things, done quietly, with people who care."
      },
      { 
        name: "<strong>Help out</strong>", 
        description: "",
        isLink: true
      }
    ]
  },
  {
    title: "Stay Close",
    items: [
      { 
        name: "First in. Best table. Quiet heads-up.", 
        description: "We don't do loyalty cards. But we notice who sticks around. Stay close and you'll hear about things before they land. Early access to events. Priority tables on busy nights. The odd off-menu thing when it feels right. No noise. No spam. Just the good stuff, first."
      },
      { 
        name: "<strong>If you know, you know</strong>", 
        description: "",
        isLink: true
      }
    ]
  }
];

export { cafeMenu as cafeMenuData, cocktailMenu as cocktailsMenuData, beerMenu as beerMenuData, kitchensMenu as kitchensMenuData, hallMenu as hallMenuData, homeMenu, communityMenuData, commonRoomMenuData };