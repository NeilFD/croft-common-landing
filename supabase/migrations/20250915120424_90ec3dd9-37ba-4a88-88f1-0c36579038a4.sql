-- Clear existing incomplete café content from kitchens-cafe
DELETE FROM cms_menu_items WHERE section_id IN (SELECT id FROM cms_menu_sections WHERE page = 'kitchens-cafe');
DELETE FROM cms_menu_sections WHERE page = 'kitchens-cafe';
DELETE FROM cms_content WHERE page = 'kitchens-cafe';

-- Add café page title and subtitle for kitchens system
INSERT INTO cms_content (page, section, content_key, content_data, content_type, published, created_by)
VALUES 
  ('kitchens-cafe', 'header', 'title', '{"text": "Croft Common Café"}', 'text', true, NULL),
  ('kitchens-cafe', 'header', 'subtitle', '{"text": "Daytime. Bright. Vibrant."}', 'text', true, NULL)
ON CONFLICT (page, section, content_key) 
DO UPDATE SET 
  content_data = EXCLUDED.content_data,
  updated_at = now();

-- Create café menu sections for kitchens system
INSERT INTO cms_menu_sections (page, section_name, sort_order, published, created_by) VALUES
('kitchens-cafe', 'Breakfast', 1, true, NULL),
('kitchens-cafe', 'Pastries', 2, true, NULL),
('kitchens-cafe', 'Sandwiches', 3, true, NULL),
('kitchens-cafe', 'Salads & Bowls', 4, true, NULL),
('kitchens-cafe', 'Plates & Counter', 5, true, NULL),
('kitchens-cafe', 'Sweets & Cakes', 6, true, NULL);

-- Add Breakfast items
INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published, created_by)
SELECT s.id, item.item_name, item.description, item.price, item.sort_order, true, NULL
FROM cms_menu_sections s
CROSS JOIN (VALUES
  ('Shakshuka', 'Eggs poached in spiced tomato sauce, served with sourdough', '£12.50', 1),
  ('Full English Breakfast', 'Cumberland sausage, bacon, black pudding, eggs, baked beans, grilled tomato, mushrooms, sourdough toast', '£14.50', 2),
  ('Avocado Toast', 'Smashed avocado, poached egg, chili flakes, lime, sourdough', '£9.50', 3),
  ('Granola Bowl', 'House granola, Greek yogurt, seasonal fruit, honey', '£8.50', 4),
  ('Pancakes', 'Buttermilk pancakes, maple syrup, seasonal berries', '£10.50', 5)
) AS item(item_name, description, price, sort_order)
WHERE s.page = 'kitchens-cafe' AND s.section_name = 'Breakfast';

-- Add Pastries items
INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published, created_by)
SELECT s.id, item.item_name, item.description, item.price, item.sort_order, true, NULL
FROM cms_menu_sections s
CROSS JOIN (VALUES
  ('Croissant', 'Fresh baked daily', '£3.50', 1),
  ('Pain au Chocolat', 'Buttery pastry with dark chocolate', '£4.00', 2),
  ('Almond Croissant', 'With almond cream and flaked almonds', '£4.50', 3),
  ('Danish Pastry', 'Seasonal fruit varieties', '£4.00', 4),
  ('Scone', 'Plain or fruit, served with jam and clotted cream', '£3.50', 5),
  ('Muffin', 'Daily selection of flavors', '£3.00', 6)
) AS item(item_name, description, price, sort_order)
WHERE s.page = 'kitchens-cafe' AND s.section_name = 'Pastries';

-- Add Sandwiches items
INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published, created_by)
SELECT s.id, item.item_name, item.description, item.price, item.sort_order, true, NULL
FROM cms_menu_sections s
CROSS JOIN (VALUES
  ('Club Sandwich', 'Chicken, bacon, lettuce, tomato, mayo on sourdough', '£11.50', 1),
  ('BLT', 'Crispy bacon, lettuce, tomato, mayo on sourdough', '£8.50', 2),
  ('Grilled Cheese', 'Three cheese blend on sourdough', '£7.50', 3),
  ('Tuna Melt', 'Tuna salad, cheese, grilled on sourdough', '£9.50', 4),
  ('Chicken Caesar Wrap', 'Grilled chicken, romaine, parmesan, caesar dressing', '£10.50', 5),
  ('Veggie Wrap', 'Hummus, roasted vegetables, spinach, feta', '£9.00', 6)
) AS item(item_name, description, price, sort_order)
WHERE s.page = 'kitchens-cafe' AND s.section_name = 'Sandwiches';

-- Add Salads & Bowls items
INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published, created_by)
SELECT s.id, item.item_name, item.description, item.price, item.sort_order, true, NULL
FROM cms_menu_sections s
CROSS JOIN (VALUES
  ('Caesar Salad', 'Romaine lettuce, parmesan, croutons, caesar dressing', '£9.50', 1),
  ('Buddha Bowl', 'Quinoa, roasted vegetables, avocado, tahini dressing', '£12.50', 2),
  ('Greek Salad', 'Tomatoes, cucumber, olives, feta, olive oil dressing', '£10.50', 3),
  ('Superfood Salad', 'Kale, quinoa, pomegranate, nuts, lemon dressing', '£11.50', 4),
  ('Chicken Salad', 'Grilled chicken, mixed greens, seasonal vegetables', '£13.50', 5)
) AS item(item_name, description, price, sort_order)
WHERE s.page = 'kitchens-cafe' AND s.section_name = 'Salads & Bowls';

-- Add Plates & Counter items
INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published, created_by)
SELECT s.id, item.item_name, item.description, item.price, item.sort_order, true, NULL
FROM cms_menu_sections s
CROSS JOIN (VALUES
  ('Soup of the Day', 'Served with sourdough bread', '£6.50', 1),
  ('Cheese & Charcuterie', 'Selection of artisan cheeses and cured meats', '£16.50', 2),
  ('Hummus Plate', 'House hummus, vegetables, olives, pita bread', '£8.50', 3),
  ('Flatbread Pizza', 'Margherita or seasonal toppings', '£11.50', 4),
  ('Fish & Chips', 'Beer battered fish, hand cut chips, mushy peas', '£15.50', 5)
) AS item(item_name, description, price, sort_order)
WHERE s.page = 'kitchens-cafe' AND s.section_name = 'Plates & Counter';

-- Add Sweets & Cakes items
INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published, created_by)
SELECT s.id, item.item_name, item.description, item.price, item.sort_order, true, NULL
FROM cms_menu_sections s
CROSS JOIN (VALUES
  ('Chocolate Brownie', 'Rich chocolate brownie with vanilla ice cream', '£6.50', 1),
  ('Carrot Cake', 'With cream cheese frosting', '£5.50', 2),
  ('Lemon Tart', 'Tangy lemon curd in pastry shell', '£6.00', 3),
  ('Cheesecake', 'Daily selection of flavors', '£6.50', 4),
  ('Apple Crumble', 'Served warm with custard', '£6.00', 5),
  ('Ice Cream', 'Selection of artisan flavors', '£4.50', 6)
) AS item(item_name, description, price, sort_order)
WHERE s.page = 'kitchens-cafe' AND s.section_name = 'Sweets & Cakes';