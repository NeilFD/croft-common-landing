// Shared image mapping for lunch run sandwiches
export const getLunchRunImage = (sandwichName: string): string | null => {
  const imageMap: { [key: string]: string } = {
    'The Med': '/lovable-uploads/35ecafad-f268-4164-9069-284e858ea4d3.png',
    'The Reuben': '/lovable-uploads/d5333fba-f3da-4177-8a9c-ff249b061320.png',
    'The Capo': '/lovable-uploads/87a8b2d5-1d02-499b-8bfb-322d4b602944.png',
    'The Deli': '/lovable-uploads/464c5a05-161f-4732-b508-f8c7df8c7b7b.png'
  };
  return imageMap[sandwichName] || null;
};