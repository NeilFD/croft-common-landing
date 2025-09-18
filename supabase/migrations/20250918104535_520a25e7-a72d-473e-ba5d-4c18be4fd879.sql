-- First, clear existing beer menu items to replace with new content
DELETE FROM cms_menu_items WHERE section_id IN (
  SELECT id FROM cms_menu_sections WHERE page = 'beer'
);

-- Delete existing beer menu sections
DELETE FROM cms_menu_sections WHERE page = 'beer';

-- Create the Beer Food section
INSERT INTO cms_menu_sections (page, section_name, sort_order, published) VALUES 
('beer', 'Beer Food', 1, true);

-- Get the section ID for inserting items
DO $$
DECLARE
    section_uuid UUID;
BEGIN
    SELECT id INTO section_uuid FROM cms_menu_sections WHERE page = 'beer' AND section_name = 'Beer Food';
    
    -- Insert the new beer food items
    INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES 
    (section_uuid, 'Buffalo Wings', 'Blue Cheese, hot sauce, cool dip.', '£8', 1, true),
    (section_uuid, 'Korean Wings', 'Gochujang, Sesame, sticky, spicy.', '£9', 2, true),
    (section_uuid, 'BBQ Wings', 'Smoked Chilli, sweet heat, char.', '£9', 3, true),
    (section_uuid, 'Loaded Fries', 'Beer Cheese, Jalapeño, rich, sharp, messy.', '£7', 4, true),
    (section_uuid, 'Soft Pretzel', 'Beer Cheese Dip, warm, salty, molten dip.', '£6', 5, true),
    (section_uuid, 'Bao Bun', 'Crispy Pork, Hoisin, Pickles, soft, rich, sharp.', '£9', 6, true),
    (section_uuid, 'Smash Burger', 'Pickles, American Cheese, two patties, toasted bun.', '£14', 7, true),
    (section_uuid, 'Buttermilk Fried Chicken Sandwich', 'brioche, hot mayo, slaw.', '£12', 8, true),
    (section_uuid, 'Pulled Pork Roll', 'Pickled Red Cabbage, sweet, sour, rich pork.', '£12', 9, true),
    (section_uuid, 'Bratwurst', 'Mustard, Pretzel Bun, German classic, beer''s best friend.', '£10', 10, true);
END $$;