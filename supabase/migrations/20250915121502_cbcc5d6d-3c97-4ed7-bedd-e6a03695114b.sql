-- Clear all existing content for kitchens-sunday page
DELETE FROM public.cms_menu_items WHERE section_id IN (
  SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday'
);
DELETE FROM public.cms_menu_sections WHERE page = 'kitchens-sunday';
DELETE FROM public.cms_content WHERE page = 'kitchens-sunday';

-- Add page title and subtitle for Sunday
INSERT INTO public.cms_content (page, section, content_key, content_data, content_type, published) VALUES
('kitchens-sunday', 'hero', 'title', '"Croft Common Sunday"', 'text', true),
('kitchens-sunday', 'hero', 'description', '"Breakfast. Brunch. Roasts."', 'text', true);

-- Insert menu sections for Sunday
INSERT INTO public.cms_menu_sections (page, section_name, sort_order, published) VALUES
('kitchens-sunday', 'Breakfast & Brunch', 1, true),
('kitchens-sunday', 'Small Plates', 2, true),
('kitchens-sunday', 'Sunday Roasts', 3, true),
('kitchens-sunday', 'Large Plates', 4, true),
('kitchens-sunday', 'Sunday Puddings', 5, true);

-- Insert Breakfast & Brunch items
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Breakfast & Brunch'), 'Croft Common Full English', 'rare breed sausage, smoked bacon, fried egg, tomato, mushroom, beans, sourdough.', '£12', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Breakfast & Brunch'), 'Veggie English', 'field mushroom, halloumi, avocado, roast tomato, beans, sourdough.', '£11', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Breakfast & Brunch'), 'Breakfast Pizza', 'sourdough base, bacon, sausage, black pudding, egg, mozzarella, tomato.', '£14', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Breakfast & Brunch'), 'Eggs Benedict', 'poached eggs, ham hock, hollandaise, muffin.', '£10', 4, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Breakfast & Brunch'), 'Eggs Florentine', 'poached eggs, spinach, hollandaise, muffin.', '£9', 5, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Breakfast & Brunch'), 'Eggs Royale', 'poached eggs, smoked salmon, hollandaise, muffin.', '£11', 6, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Breakfast & Brunch'), 'Shakshuka', 'spiced tomato, baked eggs, yoghurt, flatbread.', '£9', 7, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Breakfast & Brunch'), 'Avocado & Poached Egg', 'chilli, lime, pumpkin seeds, sourdough.', '£9', 8, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Breakfast & Brunch'), 'Overnight Oats', 'rolled oats, almond milk, berries, toasted seeds.', '£6', 9, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Breakfast & Brunch'), 'Greek Yoghurt Bowl', 'granola, honey, figs, pistachio.', '£7', 10, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Breakfast & Brunch'), 'Oysters on Ice', 'lemon, shallot vinegar, tabasco.', '£3 each', 11, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Breakfast & Brunch'), 'Bloody Mary', 'house mix, spice, celery.', '£8', 12, true);

-- Insert Small Plates items
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Small Plates'), 'Charred Octopus, Potato, Aioli', 'Galician style, tender with smoke.', '£10', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Small Plates'), 'Beef Short Rib Croquettes', 'rich, slow-cooked beef, crisp outside.', '£11', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Small Plates'), 'Wood-Roast Aubergine, White Miso Glaze, Sesame', 'umami depth, fire char.', '£8', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Small Plates'), 'Crispy Squid, Lemon, Seaweed Salt', 'light fry, fresh squeeze.', '£11', 4, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Small Plates'), 'Karaage Fried Chicken, Yuzu Mayo', 'crisp fry, citrus lift.', '£9', 5, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Small Plates'), 'Chorizo al Vino', 'Rioja reduction, garlic, heat.', '£8', 6, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Small Plates'), 'Welsh Salt Marsh Lamb Chops', 'flame-licked, smoked salt, mint.', '£14', 7, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Small Plates'), 'Heritage Tomato & Burrata', 'ripe tomatoes, creamy burrata, basil oil, sourdough crumbs.', '£10', 8, true);

-- Insert Sunday Roasts items
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Sunday Roasts'), 'Rib of Beef, Horseradish Cream', 'All the trimmings.', '£24', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Sunday Roasts'), 'Roast Chicken, Bread Sauce', 'All the trimmings.', '£18', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Sunday Roasts'), 'Roast of the Week', 'lamb with mint sauce, or pork with apple sauce. All the trimmings.', '£20', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Sunday Roasts'), 'Vegetarian Roast, Mushroom Gravy', 'All the trimmings.', '£16', 4, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Sunday Roasts'), 'All In Sharing Board (For Two)', 'A little of everything - rib of beef, roast chicken, roast of the week. all the trimmings, family-style, served on boards and stands.', '£45', 5, true);

-- Insert Large Plates items
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Large Plates'), 'Miso Glazed Salmon, Sesame Greens', 'sweet-savory glaze, charred edges.', '£28', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Large Plates'), 'Wood Oven Gnocchi, Wild Mushrooms, Aged Parmesan', 'pillowy, earthy, fire-licked.', '£20', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Large Plates'), 'Braised Beef Short Rib, Red Wine, Mash, Charred Carrot', 'slow-cooked, falling apart, deep sauce.', '£24', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Large Plates'), 'Confit Duck Leg, White Beans, Smoked Sausage, Gremolata', 'cassoulet style, rustic and rich.', '£22', 4, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Large Plates'), 'Charred Aubergine, Tahini, Pomegranate, Flatbread', 'smoky, rich, sharp edge.', '£18', 5, true);

-- Insert Sunday Puddings items
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Sunday Puddings'), 'Apple Pie & Custard', 'buttery pastry, soft apples.', '£7', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Sunday Puddings'), 'Jam Roly Poly & Custard', 'warm, nostalgic, steamed roll.', '£7', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Sunday Puddings'), 'Bread & Butter Pudding, Raisins, Cream', 'soft layers, caramelised top.', '£7', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Sunday Puddings'), 'Sticky Toffee Pudding, Salted Caramel, Ice Cream', 'indulgent, soft sponge.', '£9', 4, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Sunday Puddings'), 'Treacle Sponge & Custard', 'steamed, golden syrup, light sponge.', '£7', 5, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-sunday' AND section_name = 'Sunday Puddings'), 'Rhubarb Crumble & Custard', 'sharp fruit, buttery topping.', '£7', 6, true);