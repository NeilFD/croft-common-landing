-- Clear existing incomplete café content from kitchens-cafe
DELETE FROM cms_menu_sections WHERE page = 'kitchens-cafe';
DELETE FROM cms_menu_items WHERE section_id IN (SELECT id FROM cms_menu_sections WHERE page = 'kitchens-cafe');
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

-- Add café menu items
WITH section_ids AS (
  SELECT id, section_name FROM cms_menu_sections WHERE page = 'kitchens-cafe'
)
INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published, created_by)
SELECT 
  s.id,
  item_data.item_name,
  item_data.description,
  item_data.price,
  item_data.sort_order,
  true,
  NULL
FROM section_ids s
CROSS JOIN LATERAL (
  SELECT * FROM (VALUES
    -- Breakfast items
    ('Breakfast', 'Shakshuka', 'Eggs poached in spiced tomato sauce, served with sourdough', '£12.50', 1),
    ('Breakfast', 'Full English Breakfast', 'Cumberland sausage, bacon, black pudding, eggs, baked beans, grilled tomato, mushrooms, sourdough toast', '£14.50', 2),
    ('Breakfast', 'Avocado Toast', 'Smashed avocado, poached egg, chili flakes, lime, sourdough', '£9.50', 3),
    ('Breakfast', 'Granola Bowl', 'House granola, Greek yogurt, seasonal fruit, honey', '£8.50', 4),
    ('Breakfast', 'Pancakes', 'Buttermilk pancakes, maple syrup, seasonal berries', '£10.50', 5),
    
    -- Pastries items
    ('Pastries', 'Croissant', 'Fresh baked daily', '£3.50', 1),
    ('Pastries', 'Pain au Chocolat', 'Buttery pastry with dark chocolate', '£4.00', 2),
    ('Pastries', 'Almond Croissant', 'With almond cream and flaked almonds', '£4.50', 3),
    ('Pastries', 'Danish Pastry', 'Seasonal fruit varieties', '£4.00', 4),
    ('Pastries', 'Scone', 'Plain or fruit, served with jam and clotted cream', '£3.50', 5),
    ('Pastries', 'Muffin', 'Daily selection of flavors', '£3.00', 6),
    
    -- Sandwiches items
    ('Sandwiches', 'Club Sandwich', 'Chicken, bacon, lettuce, tomato, mayo on sourdough', '£11.50', 1),
    ('Sandwiches', 'BLT', 'Crispy bacon, lettuce, tomato, mayo on sourdough', '£8.50', 2),
    ('Sandwiches', 'Grilled Cheese', 'Three cheese blend on sourdough', '£7.50', 3),
    ('Sandwiches', 'Tuna Melt', 'Tuna salad, cheese, grilled on sourdough', '£9.50', 4),
    ('Sandwiches', 'Chicken Caesar Wrap', 'Grilled chicken, romaine, parmesan, caesar dressing', '£10.50', 5),
    ('Sandwiches', 'Veggie Wrap', 'Hummus, roasted vegetables, spinach, feta', '£9.00', 6),
    
    -- Salads & Bowls items
    ('Salads & Bowls', 'Caesar Salad', 'Romaine lettuce, parmesan, croutons, caesar dressing', '£9.50', 1),
    ('Salads & Bowls', 'Buddha Bowl', 'Quinoa, roasted vegetables, avocado, tahini dressing', '£12.50', 2),
    ('Salads & Bowls', 'Greek Salad', 'Tomatoes, cucumber, olives, feta, olive oil dressing', '£10.50', 3),
    ('Salads & Bowls', 'Superfood Salad', 'Kale, quinoa, pomegranate, nuts, lemon dressing', '£11.50', 4),
    ('Salads & Bowls', 'Chicken Salad', 'Grilled chicken, mixed greens, seasonal vegetables', '£13.50', 5),
    
    -- Plates & Counter items
    ('Plates & Counter', 'Soup of the Day', 'Served with sourdough bread', '£6.50', 1),
    ('Plates & Counter', 'Cheese & Charcuterie', 'Selection of artisan cheeses and cured meats', '£16.50', 2),
    ('Plates & Counter', 'Hummus Plate', 'House hummus, vegetables, olives, pita bread', '£8.50', 3),
    ('Plates & Counter', 'Flatbread Pizza', 'Margherita or seasonal toppings', '£11.50', 4),
    ('Plates & Counter', 'Fish & Chips', 'Beer battered fish, hand cut chips, mushy peas', '£15.50', 5),
    
    -- Sweets & Cakes items
    ('Sweets & Cakes', 'Chocolate Brownie', 'Rich chocolate brownie with vanilla ice cream', '£6.50', 1),
    ('Sweets & Cakes', 'Carrot Cake', 'With cream cheese frosting', '£5.50', 2),
    ('Sweets & Cakes', 'Lemon Tart', 'Tangy lemon curd in pastry shell', '£6.00', 3),
    ('Sweets & Cakes', 'Cheesecake', 'Daily selection of flavors', '£6.50', 4),
    ('Sweets & Cakes', 'Apple Crumble', 'Served warm with custard', '£6.00', 5),
    ('Sweets & Cakes', 'Ice Cream', 'Selection of artisan flavors', '£4.50', 6)
  ) AS item_data(section_name, item_name, description, price, sort_order)
) item_data ON s.section_name = item_data.section_name;