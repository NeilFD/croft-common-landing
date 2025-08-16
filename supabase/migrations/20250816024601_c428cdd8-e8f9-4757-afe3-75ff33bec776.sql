-- Increase character limits for menu tables to accommodate longer content
ALTER TABLE cms_menu_sections 
ALTER COLUMN section_name TYPE TEXT;

ALTER TABLE cms_menu_items 
ALTER COLUMN item_name TYPE TEXT,
ALTER COLUMN price TYPE TEXT;

-- Also increase limits for modal content table
ALTER TABLE cms_modal_content
ALTER COLUMN content_key TYPE TEXT;