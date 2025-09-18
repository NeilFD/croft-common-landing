-- Update Beer Food section sort order to be third
UPDATE cms_menu_sections 
SET sort_order = 2 
WHERE page = 'beer' AND section_name = 'Beer Food';

-- Insert DRAUGHT - LOCAL ONLY section
INSERT INTO cms_menu_sections (page, section_name, sort_order, published, created_at, updated_at)
VALUES ('beer', 'DRAUGHT - LOCAL ONLY', 0, true, now(), now());

-- Insert IN CANS section  
INSERT INTO cms_menu_sections (page, section_name, sort_order, published, created_at, updated_at)
VALUES ('beer', 'IN CANS', 1, true, now(), now());

-- Get the section IDs for inserting items
DO $$
DECLARE
    draught_section_id uuid;
    cans_section_id uuid;
BEGIN
    -- Get section IDs
    SELECT id INTO draught_section_id FROM cms_menu_sections WHERE page = 'beer' AND section_name = 'DRAUGHT - LOCAL ONLY';
    SELECT id INTO cans_section_id FROM cms_menu_sections WHERE page = 'beer' AND section_name = 'IN CANS';
    
    -- Insert DRAUGHT - LOCAL ONLY items
    INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published, created_at, updated_at) VALUES
    (draught_section_id, 'Left Handed Giant - Sky Above (Pale Ale)', '4.5%', '6.0', 0, true, now(), now()),
    (draught_section_id, 'Left Handed Giant - Dream House (IPA)', '6.2%', '7.0', 1, true, now(), now()),
    (draught_section_id, 'Left Handed Giant - West Coast Pils', '5.0%', '6.5', 2, true, now(), now()),
    (draught_section_id, 'Wiper & True - Kaleidoscope (Pale Ale)', '4.2%', '6.0', 3, true, now(), now()),
    (draught_section_id, 'Wiper & True - Milkshake Porter', '5.3%', '6.5', 4, true, now(), now()),
    (draught_section_id, 'Lost & Grounded - Keller Pils', '4.8%', '6.0', 5, true, now(), now()),
    (draught_section_id, 'Lost & Grounded - Apophenia (Tripel)', '8.8%', '7.5', 6, true, now(), now()),
    (draught_section_id, 'Bristol Beer Factory - Southville Hop IPA', '6.5%', '7.0', 7, true, now(), now()),
    (draught_section_id, 'Bristol Beer Factory - Milk Stout', '4.5%', '6.0', 8, true, now(), now()),
    (draught_section_id, 'LHG - Infinite Days IPA', '6.5%', '7.0', 9, true, now(), now()),
    (draught_section_id, 'LHG - Ready, Set, Go!', '6.5%', '7.0', 10, true, now(), now()),
    (draught_section_id, 'LHG - Twin Cities (GF Pale Ale)', '5.5%', '6.5', 11, true, now(), now()),
    (draught_section_id, 'Twelve lines. Rotating. Pints or halves. Cold only.', '', '', 12, true, now(), now());
    
    -- Insert IN CANS item
    INSERT INTO cms_menu_items (section_id, item_name, description, price, sort_order, published, created_at, updated_at) VALUES
    (cans_section_id, 'More from above. Plus guest sours, strong things, and hoppy weirdos.', '', '', 0, true, now(), now());
END $$;