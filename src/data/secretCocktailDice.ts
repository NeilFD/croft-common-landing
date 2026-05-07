export type DiceCategory = {
  label: string;
  faces: string[];
};

const sharedSpirit: DiceCategory = {
  label: "Spirit",
  faces: ["Gin", "Vodka", "Mezcal", "Rye", "Aged Rum", "Cognac"],
};

const sharedModifier: DiceCategory = {
  label: "Modifier",
  faces: [
    "Dry Vermouth",
    "Sweet Vermouth",
    "Campari",
    "Suze",
    "Cherry Liqueur",
    "Yellow Chartreuse",
  ],
};

const sharedAcid: DiceCategory = {
  label: "Acid",
  faces: [
    "Lemon",
    "Lime",
    "Verjus",
    "Pink Grapefruit",
    "Apple Cider Vinegar",
    "Yuzu",
  ],
};

const sharedSweet: DiceCategory = {
  label: "Sweet",
  faces: [
    "Honey Syrup",
    "Demerara",
    "Raspberry",
    "Rhubarb",
    "Fig Jam",
    "Maple",
  ],
};

const townTwist: DiceCategory = {
  label: "Twist",
  faces: [
    "Velvet Falernum",
    "Lavender Bitters",
    "Burnt Orange Oil",
    "Pink Peppercorn",
    "Smoked Salt Rim",
    "Edible Gold",
  ],
};

const countryTwist: DiceCategory = {
  label: "Twist",
  faces: [
    "Wood Smoke",
    "Beech Bitters",
    "Sloe Gin Float",
    "Rosemary Sprig",
    "Bramble Shrub",
    "Charred Thyme",
  ],
};

export const townDice: DiceCategory[] = [
  sharedSpirit,
  sharedModifier,
  sharedAcid,
  sharedSweet,
  townTwist,
];

export const countryDice: DiceCategory[] = [
  sharedSpirit,
  sharedModifier,
  sharedAcid,
  sharedSweet,
  countryTwist,
];
