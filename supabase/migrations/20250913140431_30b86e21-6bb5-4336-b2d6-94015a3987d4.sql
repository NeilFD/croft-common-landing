-- Migration to populate CMS with Kitchens menu and recipe data

-- First, create menu sections for each tab
INSERT INTO public.cms_menu_sections (page, section_name, sort_order, published, created_by)
VALUES
-- Main menu sections  
('kitchens-main', 'Bites', 10, true, null),
('kitchens-main', 'Small Plates', 20, true, null),
('kitchens-main', 'Wood-Fired Pizzas', 30, true, null),
('kitchens-main', 'Large Plates', 40, true, null),
('kitchens-main', 'Charcoal Grill', 50, true, null),
('kitchens-main', 'Common Boards for 2', 60, true, null),
('kitchens-main', 'Beer Food', 70, true, null),
('kitchens-main', 'Sides', 80, true, null),
('kitchens-main', 'Pudding', 90, true, null),

-- Cafe sections
('kitchens-cafe', 'Breakfast', 10, true, null),
('kitchens-cafe', 'Pastries', 20, true, null),
('kitchens-cafe', 'Sandwiches & Light Bites', 30, true, null),
('kitchens-cafe', 'Coffee & Beverages', 40, true, null),

-- Sunday sections  
('kitchens-sunday', 'Sunday Roasts', 10, true, null),
('kitchens-sunday', 'Sunday Sides', 20, true, null),
('kitchens-sunday', 'Sunday Puddings', 30, true, null),

-- Hideout sections
('kitchens-hideout', 'PIZZA - WOOD-FIRED', 10, true, null),
('kitchens-hideout', 'GRILL', 20, true, null),
('kitchens-hideout', 'MEXICAN', 30, true, null),
('kitchens-hideout', 'ASIAN STREET FOOD', 40, true, null),

-- Halls sections
('kitchens-halls', 'Private Dining', 10, true, null),
('kitchens-halls', 'Event Packages', 20, true, null),
('kitchens-halls', 'Canape Selection', 30, true, null);

-- Now populate menu items for Main menu
WITH main_sections AS (
  SELECT id, section_name FROM public.cms_menu_sections 
  WHERE page = 'kitchens-main'
)
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published, created_by)
SELECT 
  ms.id,
  items.name,
  items.description,
  items.price,
  items.sort_order,
  true,
  null
FROM main_sections ms
CROSS JOIN LATERAL (
  VALUES 
    -- Bites section
    ('Bites', 'Marinated Gordal Olives, Orange Zest', 'plump, green, briny.', '£6', 10),
    ('Bites', 'Wood Oven Flatbread, Smoked Butter', 'soft, blistered, butter from Somerset.', '£5', 20),
    ('Bites', 'Padron Peppers, Sea Salt, Nduja', 'charred, salted, hidden heat.', '£8', 30),
    ('Bites', 'Jamón Croquetas', 'crisp, molten béchamel, Jamón Ibérico.', '£9', 40),
    ('Bites', 'Crispy Chickpeas, Chilli & Lime', 'crunchy, sharp, fire snack.', '£6', 50),
    ('Bites', 'Whipped Cod Roe, Toasted Flatbread', 'smoky, salty, whipped light.', '£8', 60),
    ('Bites', 'Smoked Almonds', 'deep roast, sea salt.', '£4', 70),
    ('Bites', 'Edamame, Chilli Salt', 'steamed, tossed hot.', '£5', 80),
    
    -- Small Plates section
    ('Small Plates', 'Charred Octopus, Potato, Aioli', 'Galician style, tender with smoke.', '£10', 10),
    ('Small Plates', 'Beef Short Rib Croquettes', 'rich, slow-cooked beef, crisp outside.', '£11', 20),
    ('Small Plates', 'Wood-Roast Aubergine, White Miso Glaze, Sesame', 'umami depth, fire char.', '£8', 30),
    ('Small Plates', 'Chorizo al Vino', 'Rioja reduction, garlic, heat.', '£8', 40),
    ('Small Plates', 'Smoked Bone Marrow, Toast, Parsley', 'dripping richness.', '£9', 50),
    ('Small Plates', 'King Oyster Mushroom, Chimichurri', 'meaty texture, green sharpness.', '£7', 60),
    ('Small Plates', 'Crispy Squid, Lemon, Seaweed Salt', 'light fry, fresh squeeze.', '£11', 70),
    ('Small Plates', 'Thai Spiced Fishcakes, Sweet Chilli Dip', 'aromatic, punchy, bright.', '£8', 80),
    ('Small Plates', 'Cauliflower, Harissa Yoghurt, Almond', 'scorched edges, sweet heat.', '£7', 90),
    ('Small Plates', 'Sticky Pork Belly, Burnt Pineapple', 'sweet, char, fat and acid.', '£9', 100),
    ('Small Plates', 'Welsh Salt Marsh Lamb Chops, Mint, Smoked Salt', 'tender, flame-licked.', '£14', 110),
    ('Small Plates', 'Seared Scallop, Brown Butter, Garlic Crumb', 'West Country scallops, caramelised.', '£5 each', 120),
    ('Small Plates', 'Karaage Fried Chicken, Yuzu Mayo', 'crisp fry, citrus lift.', '£9', 130),
    
    -- Wood-Fired Pizzas section
    ('Wood-Fired Pizzas', 'Margherita', 'San Marzano tomato, Fior di Latte, Basil.', '£12', 10),
    ('Wood-Fired Pizzas', 'Nduja', 'tomato, spicy Calabrian sausage, ricotta, hot honey.', '£16', 20),
    ('Wood-Fired Pizzas', 'Bianca', 'garlic cream base, wild mushrooms, Taleggio.', '£14', 30),
    ('Wood-Fired Pizzas', 'Prosciutto', 'tomato, Parma ham, rocket, Parmesan.', '£16', 40),
    ('Wood-Fired Pizzas', 'Four Cheese', 'mozzarella, Gorgonzola, Taleggio, Pecorino.', '£14', 50),
    ('Wood-Fired Pizzas', 'Korean BBQ Beef', 'gochujang glaze, spring onion, sesame.', '£18', 60),
    ('Wood-Fired Pizzas', 'Clam Pizza', 'garlic butter, fresh clams, chilli, lemon.', '£19', 70),
    ('Wood-Fired Pizzas', 'Vegetale', 'tomato, charred aubergine, courgette, peppers.', '£13', 80),
    ('Wood-Fired Pizzas', 'Carne', 'tomato, beef short rib, red onion, smoked chilli.', '£18', 90),
    ('Wood-Fired Pizzas', 'Truffle Mushroom', 'garlic cream, porcini, truffle oil, parmesan.', '£20', 100)
) AS items(section_name, name, description, price, sort_order)
WHERE ms.section_name = items.section_name;

-- Continue with Large Plates, Charcoal Grill, etc. in next query batch
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published, created_by)
SELECT 
  ms.id,
  items.name,
  items.description,
  items.price,
  items.sort_order,
  true,
  null
FROM (SELECT id, section_name FROM public.cms_menu_sections WHERE page = 'kitchens-main') ms
CROSS JOIN LATERAL (
  VALUES 
    -- Large Plates section
    ('Large Plates', 'Braised Beef Short Rib, Red Wine, Mash, Charred Carrot', 'slow-cooked, falling apart, deep sauce.', '£24', 10),
    ('Large Plates', 'Confit Duck Leg, White Beans, Smoked Sausage, Gremolata', 'cassoulet style, rich and rustic.', '£22', 20),
    ('Large Plates', 'Roast Cod, Brown Shrimp Butter, Spinach, Potato', 'clean white fish, nutty butter sauce.', '£26', 30),
    ('Large Plates', 'Monkfish Tail, Tomato & Saffron Stew, Aioli', 'Basque style, bold and bright.', '£28', 40),
    ('Large Plates', 'Wood Oven Gnocchi, Wild Mushrooms, Aged Parmesan', 'pillowy, earthy, fire-licked.', '£20', 50),
    ('Large Plates', 'Charred Aubergine, Tahini, Pomegranate, Flatbread', 'smoky, rich, sharp edge.', '£18', 60),
    ('Large Plates', 'Katsu Cauliflower, Curry Sauce, Pickles, Rice', 'crisp fry, aromatic sauce.', '£20', 70),
    
    -- Charcoal Grill section
    ('Charcoal Grill', 'Flat Iron Steak, Chimichurri', 'British rare breed, seared hot.', '£22', 10),
    ('Charcoal Grill', 'Iberico Pork Chop, Apple & Mustard', 'black pig richness, sweet edge.', '£28', 20),
    ('Charcoal Grill', 'Half Chicken, Garlic & Lemon', 'marinated, flame-charred.', '£18', 30),
    ('Charcoal Grill', 'Whole Seabass, Chilli & Herb', 'clean, charred skin, fresh herbs.', '£30', 40),
    ('Charcoal Grill', 'Charred Hispi Cabbage, Black Garlic Butter', 'caramelised layers, deep umami.', '£18', 50),
    ('Charcoal Grill', 'Ribeye, Smoked Shallot', 'grass-fed, seared on the bone.', '£36', 60),
    ('Charcoal Grill', 'Miso Glazed Salmon, Sesame Greens', 'sweet-savory glaze, charred edges.', '£28', 70),
    ('Charcoal Grill', 'Welsh Salt Marsh Lamb Rump, Harissa & Mint', 'fire, spice, sweet lamb.', '£32', 80),
    ('Charcoal Grill', 'T-Bone, As is', 'prime British beef, big cut.', '£40', 90),
    
    -- Common Boards for 2 section
    ('Common Boards for 2', 'Mixed Grill Board', 'ribeye, Iberico pork, chicken, lamb ribs, sausage, chimichurri.', '£80', 10),
    ('Common Boards for 2', 'Whole Roast Fish, Salsa Verde, Lemon Potatoes', 'seabass or turbot, oven roasted.', '£60', 20),
    ('Common Boards for 2', 'Charred Vegetable Board', 'wood oven roots, flatbreads, whipped feta, pickles.', '£40', 30),
    ('Common Boards for 2', 'Churrasco Board', 'lamb ribs, chicken thighs, beef, chilli sauces.', '£75', 40),
    ('Common Boards for 2', 'Asian Board', 'Korean short ribs, Thai fishcakes, miso salmon, kimchi slaw.', '£85', 50),
    ('Common Boards for 2', 'Seafood Platter', 'octopus, squid, prawns, scallops, aioli, bread.', '£90', 60),
    ('Common Boards for 2', 'Cheese & Charcuterie Board', 'British cheeses, cured meats, pickles, chutney, artisan bread.', '£50', 70),
    
    -- Beer Food section
    ('Beer Food', 'Buffalo Wings, Blue Cheese', 'hot sauce, cool dip.', '£8', 10),
    ('Beer Food', 'Korean Wings, Gochujang, Sesame', 'sticky, spicy.', '£9', 20),
    ('Beer Food', 'BBQ Wings, Smoked Chilli', 'sweet heat, char.', '£9', 30),
    ('Beer Food', 'Loaded Fries, Beer Cheese, Jalapeño', 'rich, sharp, messy.', '£7', 40),
    ('Beer Food', 'Soft Pretzel, Beer Cheese Dip', 'warm, salty, molten dip.', '£6', 50),
    ('Beer Food', 'Bao Bun, Crispy Pork, Hoisin, Pickles', 'soft, rich, sharp.', '£9', 60),
    ('Beer Food', 'Smash Burger, Pickles, American Cheese', 'two patties, toasted bun.', '£14', 70),
    ('Beer Food', 'Buttermilk Fried Chicken Sandwich', 'brioche, hot mayo, slaw.', '£12', 80),
    ('Beer Food', 'Pulled Pork Roll, Pickled Red Cabbage', 'sweet, sour, rich pork.', '£12', 90),
    ('Beer Food', 'Bratwurst, Mustard, Pretzel Bun', 'German classic, beer''s best friend.', '£10', 100),
    
    -- Sides section
    ('Sides', 'Rosemary Fries', 'crisp, salted.', '£5', 10),
    ('Sides', 'Wood Oven Potatoes, Garlic & Herb', 'golden, blistered.', '£6', 20),
    ('Sides', 'Seasonal Greens, Lemon Oil', 'light, sharp.', '£6', 30),
    ('Sides', 'Charred Corn, Chilli Butter', 'sweet and hot.', '£5', 40),
    ('Sides', 'Tomato Salad, Basil, Olive Oil', 'ripe, clean.', '£6', 50),
    ('Sides', 'Mac & Cheese, Toasted Crumb', 'oven-baked, rich.', '£7', 60),
    ('Sides', 'Kimchi Slaw', 'sharp, hot, fermented crunch.', '£5', 70),
    
    -- Pudding section
    ('Pudding', 'Basque Cheesecake, Burnt Top', 'creamy, caramelised.', '£9', 10),
    ('Pudding', 'Wood Oven Brownie, Vanilla Ice Cream', 'dark, molten centre.', '£9', 20),
    ('Pudding', 'Churros, Dark Chocolate', 'crisp, sugar dusted, dipping pot.', '£8', 30),
    ('Pudding', 'Affogato, Amaretto', 'vanilla gelato drowned in espresso.', '£7', 40),
    ('Pudding', 'Lemon Tart, Crème Fraîche', 'sharp, smooth, buttery base.', '£8', 50),
    ('Pudding', 'Sticky Toffee Pudding, Salted Caramel, Ice Cream', 'indulgent, soft sponge.', '£9', 60),
    ('Pudding', 'Mochi Ice Cream Trio', 'matcha, mango, chocolate.', '£7', 70)
) AS items(section_name, name, description, price, sort_order)
WHERE ms.section_name = items.section_name;