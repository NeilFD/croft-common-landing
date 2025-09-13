-- Insert Café menu data into CMS with correct column names
-- First, clean up any existing cafe data to avoid duplicates
DELETE FROM cms_menu_sections WHERE page = 'cafe';

-- Insert Breakfast section
INSERT INTO cms_menu_sections (page, section_name, sort_order, published) VALUES 
('cafe', 'Breakfast', 1, true);

-- Get the breakfast section ID and insert items
INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Croft Common Full English', 'rare breed sausage, smoked bacon, fried egg, tomato, mushroom, beans, sourdough.', '£14', 1, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Breakfast';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Veggie English', 'field mushroom, halloumi, avocado, roast tomato, beans, sourdough.', '£11', 2, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Breakfast';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Eggs Benedict', 'poached eggs, ham hock, hollandaise, muffin.', '£12', 3, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Breakfast';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Eggs Florentine', 'poached eggs, spinach, hollandaise, muffin.', '£10', 4, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Breakfast';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Shakshuka', 'spiced tomato, baked eggs, yoghurt, flatbread.', '£10', 5, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Breakfast';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Avocado & Poached Egg', 'chilli, lime, pumpkin seeds, sourdough.', '£12', 6, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Breakfast';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Overnight Oats', 'rolled oats, almond milk, berries, toasted seeds.', '£8', 7, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Breakfast';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Greek Yoghurt Bowl', 'granola, honey, figs, pistachio.', '£7', 8, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Breakfast';

-- Insert Pastries section
INSERT INTO cms_menu_sections (page, section_name, sort_order, published) VALUES 
('cafe', 'Pastries', 2, true);

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Butter Croissant', 'classic, flaky, French butter.', '£4', 1, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Pastries';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Pain au Chocolat', 'dark chocolate, laminated pastry.', '£4.50', 2, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Pastries';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Almond Croissant', 'filled, dusted, rich.', '£4.50', 3, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Pastries';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Cinnamon Swirl', 'buttery roll, sugar crust.', '£4.50', 4, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Pastries';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Morning Bun', 'orange zest, sugar crust, croissant dough.', '£4', 5, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Pastries';

-- Insert Sandwiches section
INSERT INTO cms_menu_sections (page, section_name, sort_order, published) VALUES 
('cafe', 'Sandwiches', 3, true);

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Italian Deli', 'salami, mortadella, provolone, pickles, ciabatta.', '£9', 1, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Sandwiches';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Reuben', 'salt beef, sauerkraut, Swiss cheese, Russian dressing, rye.', '£12', 2, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Sandwiches';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Caprese', 'buffalo mozzarella, heritage tomato, basil, focaccia.', '£8', 3, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Sandwiches';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'The Med', 'roast vegetables, hummus, feta, ciabatta.', '£8', 4, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Sandwiches';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Roast Chicken Caesar', 'chicken, anchovy mayo, parmesan, cos lettuce, sourdough.', '£10', 5, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Sandwiches';

-- Insert Salads & Bowls section
INSERT INTO cms_menu_sections (page, section_name, sort_order, published) VALUES 
('cafe', 'Salads & Bowls', 4, true);

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Roast Cauliflower, Tahini, Pomegranate', 'spiced cauliflower, golden raisins, herbs, pistachio crunch.', '£9', 1, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Salads & Bowls';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Freekeh & Squash Grain Salad', 'charred butternut, pomegranate seeds, mint, green grains.', '£9', 2, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Salads & Bowls';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Charred Broccoli & Almond', 'tenderstem broccoli, chilli oil, garlic yoghurt, toasted nuts.', '£8', 3, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Salads & Bowls';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Heritage Tomato & Burrata', 'ripe tomatoes, creamy burrata, basil oil, sourdough crumbs.', '£12', 4, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Salads & Bowls';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Sesame Soba Noodles', 'chilled noodles, pak choi, cucumber, sesame peanut dressing.', '£9', 5, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Salads & Bowls';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Salad Counter Plate', 'choose any three of the above, generous plate.', '£12', 6, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Salads & Bowls';

-- Insert Plates & Counter section
INSERT INTO cms_menu_sections (page, section_name, sort_order, published) VALUES 
('cafe', 'Plates & Counter', 5, true);

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Frittata of the Day', 'seasonal veg, herbs, cheese.', '£7', 1, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Plates & Counter';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Wood Oven Flatbread, Labneh, Za''atar Oil', 'soft, blistered, tangy.', '£6', 2, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Plates & Counter';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Seasonal Tartlet', 'roast tomato, ricotta, basil.', '£6', 3, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Plates & Counter';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Soup of the Day, Sourdough', 'always fresh, always changing.', '£7', 4, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Plates & Counter';

-- Insert Sweets & Cakes section
INSERT INTO cms_menu_sections (page, section_name, sort_order, published) VALUES 
('cafe', 'Sweets & Cakes', 6, true);

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Polenta & Orange Cake', 'moist, citrus sharp, almond bite.', '£5', 1, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Sweets & Cakes';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Pistachio & Rose Cake', 'nutty, floral, light sponge.', '£6', 2, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Sweets & Cakes';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Chocolate Babka', 'dark, glossy, indulgent.', '£4', 3, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Sweets & Cakes';

INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published)
SELECT id, 'Date & Walnut Slice', 'sticky, rich, wholesome.', '£4', 4, true FROM cms_menu_sections WHERE page = 'cafe' AND section_name = 'Sweets & Cakes';