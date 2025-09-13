-- Insert Café menu data into CMS
-- First, clean up any existing cafe data to avoid duplicates
DELETE FROM cms_menu_sections WHERE tab_name = 'cafe';

-- Insert Breakfast section
INSERT INTO cms_menu_sections (tab_name, section_title, section_order, published) VALUES 
('cafe', 'Breakfast', 1, true);

-- Get the breakfast section ID and insert items
INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Croft Common Full English', 'rare breed sausage, smoked bacon, fried egg, tomato, mushroom, beans, sourdough.', 14.00, 1, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Breakfast';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Veggie English', 'field mushroom, halloumi, avocado, roast tomato, beans, sourdough.', 11.00, 2, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Breakfast';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Eggs Benedict', 'poached eggs, ham hock, hollandaise, muffin.', 12.00, 3, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Breakfast';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Eggs Florentine', 'poached eggs, spinach, hollandaise, muffin.', 10.00, 4, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Breakfast';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Shakshuka', 'spiced tomato, baked eggs, yoghurt, flatbread.', 10.00, 5, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Breakfast';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Avocado & Poached Egg', 'chilli, lime, pumpkin seeds, sourdough.', 12.00, 6, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Breakfast';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Overnight Oats', 'rolled oats, almond milk, berries, toasted seeds.', 8.00, 7, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Breakfast';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Greek Yoghurt Bowl', 'granola, honey, figs, pistachio.', 7.00, 8, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Breakfast';

-- Insert Pastries section
INSERT INTO cms_menu_sections (tab_name, section_title, section_order, published) VALUES 
('cafe', 'Pastries', 2, true);

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Butter Croissant', 'classic, flaky, French butter.', 4.00, 1, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Pastries';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Pain au Chocolat', 'dark chocolate, laminated pastry.', 4.50, 2, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Pastries';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Almond Croissant', 'filled, dusted, rich.', 4.50, 3, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Pastries';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Cinnamon Swirl', 'buttery roll, sugar crust.', 4.50, 4, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Pastries';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Morning Bun', 'orange zest, sugar crust, croissant dough.', 4.00, 5, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Pastries';

-- Insert Sandwiches section
INSERT INTO cms_menu_sections (tab_name, section_title, section_order, published) VALUES 
('cafe', 'Sandwiches', 3, true);

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Italian Deli', 'salami, mortadella, provolone, pickles, ciabatta.', 9.00, 1, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Sandwiches';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Reuben', 'salt beef, sauerkraut, Swiss cheese, Russian dressing, rye.', 12.00, 2, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Sandwiches';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Caprese', 'buffalo mozzarella, heritage tomato, basil, focaccia.', 8.00, 3, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Sandwiches';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'The Med', 'roast vegetables, hummus, feta, ciabatta.', 8.00, 4, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Sandwiches';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Roast Chicken Caesar', 'chicken, anchovy mayo, parmesan, cos lettuce, sourdough.', 10.00, 5, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Sandwiches';

-- Insert Salads & Bowls section
INSERT INTO cms_menu_sections (tab_name, section_title, section_order, published) VALUES 
('cafe', 'Salads & Bowls', 4, true);

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Roast Cauliflower, Tahini, Pomegranate', 'spiced cauliflower, golden raisins, herbs, pistachio crunch.', 9.00, 1, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Salads & Bowls';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Freekeh & Squash Grain Salad', 'charred butternut, pomegranate seeds, mint, green grains.', 9.00, 2, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Salads & Bowls';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Charred Broccoli & Almond', 'tenderstem broccoli, chilli oil, garlic yoghurt, toasted nuts.', 8.00, 3, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Salads & Bowls';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Heritage Tomato & Burrata', 'ripe tomatoes, creamy burrata, basil oil, sourdough crumbs.', 12.00, 4, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Salads & Bowls';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Sesame Soba Noodles', 'chilled noodles, pak choi, cucumber, sesame peanut dressing.', 9.00, 5, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Salads & Bowls';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Salad Counter Plate', 'choose any three of the above, generous plate.', 12.00, 6, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Salads & Bowls';

-- Insert Plates & Counter section
INSERT INTO cms_menu_sections (tab_name, section_title, section_order, published) VALUES 
('cafe', 'Plates & Counter', 5, true);

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Frittata of the Day', 'seasonal veg, herbs, cheese.', 7.00, 1, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Plates & Counter';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Wood Oven Flatbread, Labneh, Za''atar Oil', 'soft, blistered, tangy.', 6.00, 2, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Plates & Counter';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Seasonal Tartlet', 'roast tomato, ricotta, basil.', 6.00, 3, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Plates & Counter';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Soup of the Day, Sourdough', 'always fresh, always changing.', 7.00, 4, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Plates & Counter';

-- Insert Sweets & Cakes section
INSERT INTO cms_menu_sections (tab_name, section_title, section_order, published) VALUES 
('cafe', 'Sweets & Cakes', 6, true);

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Polenta & Orange Cake', 'moist, citrus sharp, almond bite.', 5.00, 1, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Sweets & Cakes';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Pistachio & Rose Cake', 'nutty, floral, light sponge.', 6.00, 2, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Sweets & Cakes';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Chocolate Babka', 'dark, glossy, indulgent.', 4.00, 3, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Sweets & Cakes';

INSERT INTO cms_menu_items (section_id, item_name, item_description, item_price, item_order, published)
SELECT id, 'Date & Walnut Slice', 'sticky, rich, wholesome.', 4.00, 4, true FROM cms_menu_sections WHERE tab_name = 'cafe' AND section_title = 'Sweets & Cakes';