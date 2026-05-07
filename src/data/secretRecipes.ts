export type Recipe = {
  id: string;
  kitchen: string;
  dish: string;
  story: string;
  serves: string;
  ingredients: string[];
  method: string[];
};

// Each recipe is a real main course lifted from the live menu for that kitchen.
export const recipes: Record<string, Recipe> = {
  // The Black Bear, Town. Mains > "Short Rib of Beef · horseradish, carrot".
  "blackbear": {
    id: "blackbear",
    kitchen: "The Black Bear",
    dish: "Short Rib of Beef, Horseradish, Carrot",
    story: "Eight hours low and slow. Horseradish to wake it up. Carrots to keep it honest.",
    serves: "Serves 4",
    ingredients: [
      "4 thick beef short ribs, bone in",
      "2 tbsp beef dripping",
      "2 onions, roughly chopped",
      "2 carrots plus 600g heritage carrots for the garnish",
      "4 cloves garlic, crushed",
      "500ml red wine",
      "750ml veal stock",
      "2 sprigs thyme, 1 bay leaf",
      "150g fresh horseradish root",
      "200ml double cream",
      "1 tbsp Dijon",
      "Cider vinegar, sea salt, black pepper",
    ],
    method: [
      "Heat the dripping in a heavy casserole. Season the ribs hard, sear on every face until deeply coloured. Lift out.",
      "Sweat the onions, the two chopped carrots and the garlic in the same pan until soft.",
      "Pour in the red wine, reduce by half, add the stock and herbs. Return the ribs, cover, braise at 140C for six to eight hours, until the meat slips off the bone.",
      "Lift the ribs onto a tray. Pass the sauce, return to the pan and reduce until glossy.",
      "Roast the heritage carrots whole at 200C with olive oil, salt and a splash of vinegar for twenty minutes until charred at the tips.",
      "Whip the cream to soft peaks, fold through finely grated horseradish and the Dijon, season.",
      "Plate a rib, the carrots alongside, sauce ladled over, a quenelle of horseradish cream on top.",
    ],
  },

  // B&B, Town. Mains > "Confit Duck Leg · braised lentils, pickled red onion".
  "bnb": {
    id: "bnb",
    kitchen: "B&B",
    dish: "Confit Duck Leg, Braised Lentils, Pickled Red Onion",
    story: "French at heart. Brasserie in habit. The kind of plate you order without thinking.",
    serves: "Serves 4",
    ingredients: [
      "4 duck legs",
      "60g coarse sea salt",
      "4 cloves garlic, crushed",
      "2 sprigs thyme",
      "1.2 litres duck fat, melted",
      "300g Puy lentils",
      "1 onion, finely diced",
      "1 carrot, finely diced",
      "2 sticks celery, finely diced",
      "100g smoked bacon lardons",
      "750ml chicken stock",
      "2 red onions, finely sliced",
      "150ml red wine vinegar, 50g caster sugar",
      "Flat-leaf parsley, Dijon, sea salt",
    ],
    method: [
      "Rub the duck legs with the salt, garlic and thyme. Cover and refrigerate overnight.",
      "Rinse the legs, pat dry. Submerge in melted duck fat in a casserole. Cook at 130C for three hours, until the meat surrenders.",
      "Bring the vinegar and sugar to a boil with a pinch of salt. Pour over the sliced red onions. Cool.",
      "Sweat the onion, carrot, celery and lardons in a knob of duck fat until soft. Add the lentils, stir, then the stock. Simmer twenty five minutes until tender but with bite.",
      "Lift the duck legs out of the fat. Crisp the skin under a hot grill or in a dry pan, four minutes, until it crackles.",
      "Spoon the lentils, sit a duck leg on top, scatter pickled onion and parsley, a small spoon of Dijon on the side.",
    ],
  },

  // Hom Thai, Town. The Hom Thai signature on the wok side of the house.
  "homthai": {
    id: "homthai",
    kitchen: "Hom Thai",
    dish: "Pad Krapow, Holy Basil, Bird's Eye, Fried Egg",
    story: "Bangkok street food, properly. Loud chilli, holy basil, an egg you crack into the rice.",
    serves: "Serves 2",
    ingredients: [
      "300g minced pork shoulder, 20% fat",
      "3 tbsp groundnut oil",
      "6 cloves garlic, pounded",
      "8 bird's eye chillies, pounded",
      "2 tbsp oyster sauce",
      "1 tbsp light soy",
      "1 tsp dark soy",
      "1 tsp palm sugar",
      "2 tbsp chicken stock",
      "Large handful holy basil leaves",
      "2 eggs",
      "Jasmine rice, to serve",
      "Prik nam pla: fish sauce, lime, sliced bird's eye, garlic",
    ],
    method: [
      "Heat a wok ferociously. Add a tablespoon of oil, slide in an egg and fry hard until the edges blister and crisp. Repeat with the second egg. Set aside.",
      "Add the rest of the oil to the wok, drop in the pounded garlic and chillies, count to ten.",
      "Add the pork. Break it up, press it into the wok, leave it to colour, then toss.",
      "Add the oyster sauce, both soys, palm sugar and stock. Toss until glossy.",
      "Kill the heat. Throw in the holy basil, fold once.",
      "Pile onto jasmine rice. Crown with the fried egg. Spoon prik nam pla alongside. Eat fast.",
    ],
  },

  // The Country Pub. The Pub > "Braised Ox Cheek · horseradish, bone marrow crumb, greens".
  "townpub": {
    id: "townpub",
    kitchen: "The Country Pub",
    dish: "Braised Ox Cheek, Horseradish, Bone Marrow Crumb, Greens",
    story: "The pub's quiet show off. Spoon tender. Crisp on top. Doesn't need a knife.",
    serves: "Serves 4",
    ingredients: [
      "4 ox cheeks, trimmed",
      "2 tbsp beef dripping",
      "2 onions, chopped",
      "2 carrots, diced",
      "2 sticks celery, diced",
      "4 cloves garlic, crushed",
      "500ml stout",
      "750ml beef stock",
      "1 tbsp tomato puree, 2 sprigs thyme, 1 bay",
      "200g bone marrow, diced",
      "120g panko, small bunch parsley",
      "150ml double cream, 80g fresh horseradish, grated",
      "300g cavolo nero or spring greens, butter",
    ],
    method: [
      "Sear the seasoned cheeks in dripping until dark on every side. Lift out.",
      "Soften the onion, carrot, celery and garlic. Stir in the tomato puree, then the stout, reduce by half.",
      "Add stock, herbs and the cheeks. Cover and braise at 140C for five hours.",
      "Lift the cheeks out, pass the sauce, reduce until coating.",
      "Toss the marrow and panko in a hot pan with chopped parsley until golden and fatty.",
      "Whip the cream to soft peaks, fold in the horseradish, season.",
      "Wilt the greens in butter and a splash of water.",
      "Plate the greens, sit a cheek on top, sauce, scatter the marrow crumb, a quenelle of horseradish cream beside.",
    ],
  },

  // The Country Pub, alt route (/country/pub & /country/pub/food share key but kept).
  "countrypub": {
    id: "countrypub",
    kitchen: "The Country Pub",
    dish: "Braised Ox Cheek, Horseradish, Bone Marrow Crumb, Greens",
    story: "The pub's quiet show off. Spoon tender. Crisp on top. Doesn't need a knife.",
    serves: "Serves 4",
    ingredients: [
      "4 ox cheeks, trimmed",
      "2 tbsp beef dripping",
      "2 onions, chopped",
      "2 carrots, diced",
      "2 sticks celery, diced",
      "4 cloves garlic, crushed",
      "500ml stout",
      "750ml beef stock",
      "1 tbsp tomato puree, 2 sprigs thyme, 1 bay",
      "200g bone marrow, diced",
      "120g panko, small bunch parsley",
      "150ml double cream, 80g fresh horseradish, grated",
      "300g cavolo nero or spring greens, butter",
    ],
    method: [
      "Sear the seasoned cheeks in dripping until dark on every side. Lift out.",
      "Soften the onion, carrot, celery and garlic. Stir in the tomato puree, then the stout, reduce by half.",
      "Add stock, herbs and the cheeks. Cover and braise at 140C for five hours.",
      "Lift the cheeks out, pass the sauce, reduce until coating.",
      "Toss the marrow and panko in a hot pan with chopped parsley until golden and fatty.",
      "Whip the cream to soft peaks, fold in the horseradish, season.",
      "Wilt the greens in butter and a splash of water.",
      "Plate the greens, sit a cheek on top, sauce, scatter the marrow crumb, a quenelle of horseradish cream beside.",
    ],
  },
};

export const recipeForRoute = (variant: string): Recipe => {
  const key = variant.replace("recipe-", "");
  return recipes[key] ?? recipes.blackbear;
};
