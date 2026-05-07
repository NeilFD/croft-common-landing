export type Recipe = {
  id: string;
  kitchen: string;
  dish: string;
  story: string;
  serves: string;
  ingredients: string[];
  method: string[];
};

export const recipes: Record<string, Recipe> = {
  "blackbear": {
    id: "blackbear",
    kitchen: "The Black Bear",
    dish: "Slow-Braised Beef Cheek, Bone Marrow Mash",
    story: "Six hours in the oven. One hour at the table. Dark, glossy, unrepentant.",
    serves: "Serves 4",
    ingredients: [
      "4 beef cheeks, trimmed",
      "2 tbsp beef dripping",
      "2 onions, finely chopped",
      "3 carrots, diced",
      "4 cloves garlic, crushed",
      "500ml stout",
      "500ml veal stock",
      "2 sprigs thyme, 1 bay leaf",
      "1kg Maris Piper potatoes",
      "200g bone marrow, diced",
      "150ml double cream",
      "Sea salt, black pepper",
    ],
    method: [
      "Heat the dripping in a heavy casserole. Season the cheeks hard, then sear on all sides until deeply coloured. Lift out.",
      "Lower the heat. Sweat the onions, carrots and garlic until soft and just turning gold, about ten minutes.",
      "Pour in the stout and reduce by half. Add the stock, herbs, and the cheeks. Cover and braise at 140C for five to six hours, until the meat surrenders to a spoon.",
      "Lift the cheeks out. Pass the sauce through a sieve, return to the pan and reduce until glossy and coating.",
      "Boil the potatoes in salted water until tender. Drain, dry, and pass through a ricer. Beat in the warm cream and the marrow until silky.",
      "Spoon the mash, sit a cheek on top, ladle the sauce over and finish with cracked pepper. Eat with red wine. Forget the time.",
    ],
  },
  "bnb": {
    id: "bnb",
    kitchen: "B&B",
    dish: "Roast Cod, Brown Shrimp Butter, Sea Aster",
    story: "A clean white plate. A loud little sauce. Coastal in spirit, Beaconsfield in postcode.",
    serves: "Serves 4",
    ingredients: [
      "4 thick cod loins, skin on",
      "150g unsalted butter",
      "100g brown shrimp, peeled",
      "1 lemon, zest and juice",
      "Small bunch parsley, finely chopped",
      "1 tbsp baby capers",
      "100g sea aster or samphire",
      "Olive oil, sea salt",
    ],
    method: [
      "Score the cod skin lightly. Salt generously and rest skin-up on kitchen paper for fifteen minutes to dry.",
      "Heat a heavy pan with a film of olive oil until just smoking. Lay the cod in skin-down, press flat for thirty seconds, then leave alone for four minutes until the skin is crisp.",
      "Flip, kill the heat and let the residual warmth finish the fish, about a minute.",
      "Melt the butter in a small pan until it foams and turns hazelnut. Pull off the heat. Stir in the shrimp, lemon, parsley and capers.",
      "Wilt the sea aster in a splash of water for thirty seconds. Drain.",
      "Plate the aster, sit the cod on top, spoon the warm shrimp butter generously. Serve at once.",
    ],
  },
  "homthai": {
    id: "homthai",
    kitchen: "Hom Thai",
    dish: "Massaman Lamb Shank, Crisp Shallots, Roti",
    story: "Bangkok by way of Buckinghamshire. Long, slow, fragrant. Worth the wait.",
    serves: "Serves 4",
    ingredients: [
      "4 lamb shanks",
      "2 tbsp groundnut oil",
      "4 tbsp massaman curry paste",
      "400ml coconut milk",
      "400ml coconut cream",
      "500ml chicken stock",
      "2 tbsp tamarind paste",
      "2 tbsp palm sugar",
      "3 tbsp fish sauce",
      "6 cardamom pods, 2 cinnamon sticks, 4 star anise",
      "300g new potatoes, halved",
      "100g roasted peanuts",
      "4 banana shallots, finely sliced and crisped",
      "Roti, to serve",
    ],
    method: [
      "Brown the shanks hard in the oil. Lift out.",
      "Fry the curry paste in the same pan until the oil splits and the kitchen smells like Chiang Mai.",
      "Pour in the coconut cream, stir, then the coconut milk and stock. Add the spices, tamarind, sugar and fish sauce.",
      "Return the shanks. Cover and cook at 150C for three hours, turning once.",
      "Add the potatoes for the last forty minutes. Lift the shanks. Reduce the sauce until silky.",
      "Plate the shanks, ladle the sauce, scatter peanuts and crisp shallots. Serve with warm roti and don't be polite.",
    ],
  },
  "townpub": {
    id: "townpub",
    kitchen: "The Town Pub",
    dish: "Steak and Stout Suet Pudding, Bone Gravy",
    story: "Old school. Good school. Steamed three hours, eaten in twenty minutes.",
    serves: "Serves 4",
    ingredients: [
      "600g chuck steak, diced",
      "200g ox kidney, trimmed and diced",
      "2 tbsp seasoned flour",
      "2 tbsp beef dripping",
      "2 onions, chopped",
      "330ml stout",
      "300ml beef stock",
      "1 tbsp Worcestershire sauce",
      "300g self-raising flour",
      "150g shredded suet",
      "Cold water, to bind",
      "Butter, for the basin",
    ],
    method: [
      "Toss the steak and kidney in seasoned flour. Sear in dripping until browned. Lift out.",
      "Soften the onions, deglaze with stout, add stock and Worcestershire. Return the meat. Simmer 90 minutes until thick. Cool fully.",
      "Mix flour, suet, a pinch of salt and enough water to a soft dough. Roll out two-thirds and line a buttered pudding basin.",
      "Spoon in the cold filling. Roll the rest as a lid. Seal with water, trim, cover with pleated baking paper and foil. Tie with string.",
      "Steam for three hours, topping up the water as needed.",
      "Turn out at the table. Cut, breathe in, ladle over more hot bone gravy.",
    ],
  },
  "countrypub": {
    id: "countrypub",
    kitchen: "The Country Pub",
    dish: "Whole Plaice, Caper Brown Butter, Triple-Cooked Chips",
    story: "One pan. One fish. One pint. The shortest possible distance from sea to table.",
    serves: "Serves 2",
    ingredients: [
      "2 whole plaice, gutted and trimmed",
      "Plain flour, for dusting",
      "Sea salt",
      "120g unsalted butter",
      "2 tbsp baby capers, drained",
      "1 lemon, halved",
      "Small bunch parsley, chopped",
      "1kg Maris Piper potatoes",
      "Beef dripping, for frying",
    ],
    method: [
      "For the chips: cut the potatoes into thick batons. Simmer in salted water until almost falling apart. Drain, cool, dry.",
      "Fry once at 130C for six minutes. Cool. Fry again at 180C until deep gold and rattling.",
      "Salt the plaice on both sides. Dust lightly in flour.",
      "Heat a wide pan with a knob of butter until foaming. Lay the fish dark-side down, cook four minutes, flip and cook two more.",
      "Lift out onto warm plates. Wipe the pan. Add the rest of the butter, take to hazelnut. Off the heat add capers, lemon juice and parsley.",
      "Pour the butter over the fish. Pile the chips alongside. Pint. Done.",
    ],
  },
};

export const recipeForRoute = (variant: string): Recipe => {
  const key = variant.replace("recipe-", "");
  return recipes[key] ?? recipes.blackbear;
};
