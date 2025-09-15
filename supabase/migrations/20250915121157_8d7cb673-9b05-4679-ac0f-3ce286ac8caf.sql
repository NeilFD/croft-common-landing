-- Clear all existing fake content for kitchens-cafe page
DELETE FROM public.cms_menu_items WHERE section_id IN (
  SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe'
);
DELETE FROM public.cms_menu_sections WHERE page = 'kitchens-cafe';
DELETE FROM public.cms_content WHERE page = 'kitchens-cafe';

-- Add page title and subtitle
INSERT INTO public.cms_content (page, section, content_key, content_data, content_type, published) VALUES
('kitchens-cafe', 'hero', 'title', '"CAFÉ"', 'text', true),
('kitchens-cafe', 'hero', 'description', '"Fresh coffee, seasonal dishes, artisan pastries.\n\nOrder at the counter. Table service available."', 'text', true);

-- Insert menu sections for Café
INSERT INTO public.cms_menu_sections (page, section_name, sort_order, published) VALUES
('kitchens-cafe', 'Breakfast', 1, true),
('kitchens-cafe', 'Pastries', 2, true),
('kitchens-cafe', 'Sandwiches', 3, true),
('kitchens-cafe', 'Salads & Bowls', 4, true),
('kitchens-cafe', 'Plates & Counter', 5, true),
('kitchens-cafe', 'Sweets & Cakes', 6, true);

-- Insert Breakfast items
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Breakfast'), 'Croft Common Full English', 'rare breed sausage, smoked bacon, fried egg, tomato, mushroom, beans, sourdough.', '£14', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Breakfast'), 'Veggie English', 'field mushroom, halloumi, avocado, roast tomato, beans, sourdough.', '£11', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Breakfast'), 'Eggs Benedict', 'poached eggs, ham hock, hollandaise, muffin.', '£12', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Breakfast'), 'Eggs Florentine', 'poached eggs, spinach, hollandaise, muffin.', '£10', 4, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Breakfast'), 'Shakshuka', 'spiced tomato, baked eggs, yoghurt, flatbread.', '£10', 5, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Breakfast'), 'Avocado & Poached Egg', 'chilli, lime, pumpkin seeds, sourdough.', '£12', 6, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Breakfast'), 'Overnight Oats', 'rolled oats, almond milk, berries, toasted seeds.', '£8', 7, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Breakfast'), 'Greek Yoghurt Bowl', 'granola, honey, figs, pistachio.', '£7', 8, true);

-- Insert Pastries items
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Pastries'), 'Butter Croissant', 'classic, flaky, French butter.', '£4', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Pastries'), 'Pain au Chocolat', 'dark chocolate, laminated pastry.', '£4.5', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Pastries'), 'Almond Croissant', 'filled, dusted, rich.', '£4.50', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Pastries'), 'Cinnamon Swirl', 'buttery roll, sugar crust.', '£4.50', 4, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Pastries'), 'Morning Bun', 'orange zest, sugar crust, croissant dough.', '£4', 5, true);

-- Insert Sandwiches items
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Sandwiches'), 'Italian Deli', 'salami, mortadella, provolone, pickles, ciabatta.', '£9', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Sandwiches'), 'Reuben', 'salt beef, sauerkraut, Swiss cheese, Russian dressing, rye.', '£12', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Sandwiches'), 'Caprese', 'buffalo mozzarella, heritage tomato, basil, focaccia.', '£8', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Sandwiches'), 'The Med', 'roast vegetables, hummus, feta, ciabatta.', '£8', 4, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Sandwiches'), 'Roast Chicken Caesar', 'chicken, anchovy mayo, parmesan, cos lettuce, sourdough.', '£10', 5, true);

-- Insert Salads & Bowls items
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Salads & Bowls'), 'Roast Cauliflower, Tahini, Pomegranate', 'spiced cauliflower, golden raisins, herbs, pistachio crunch.', '£9', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Salads & Bowls'), 'Freekeh & Squash Grain Salad', 'charred butternut, pomegranate seeds, mint, green grains.', '£9', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Salads & Bowls'), 'Charred Broccoli & Almond', 'tenderstem broccoli, chilli oil, garlic yoghurt, toasted nuts.', '£8', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Salads & Bowls'), 'Heritage Tomato & Burrata', 'ripe tomatoes, creamy burrata, basil oil, sourdough crumbs.', '£12', 4, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Salads & Bowls'), 'Sesame Soba Noodles', 'chilled noodles, pak choi, cucumber, sesame peanut dressing.', '£9', 5, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Salads & Bowls'), 'Salad Counter Plate', 'choose any three of the above, generous plate.', '£12', 6, true);

-- Insert Plates & Counter items
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Plates & Counter'), 'Frittata of the Day', 'seasonal veg, herbs, cheese.', '£7', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Plates & Counter'), 'Wood Oven Flatbread, Labneh, Za''atar Oil', 'soft, blistered, tangy.', '£6', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Plates & Counter'), 'Seasonal Tartlet', 'roast tomato, ricotta, basil.', '£6', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Plates & Counter'), 'Soup of the Day, Sourdough', 'always fresh, always changing.', '£7', 4, true);

-- Insert Sweets & Cakes items
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Sweets & Cakes'), 'Polenta & Orange Cake', 'moist, citrus sharp, almond bite.', '£5', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Sweets & Cakes'), 'Pistachio & Rose Cake', 'nutty, floral, light sponge.', '£6', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Sweets & Cakes'), 'Chocolate Babka', 'dark, glossy, indulgent.', '£4', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-cafe' AND section_name = 'Sweets & Cakes'), 'Date & Walnut Slice', 'sticky, rich, wholesome.', '£4', 4, true);