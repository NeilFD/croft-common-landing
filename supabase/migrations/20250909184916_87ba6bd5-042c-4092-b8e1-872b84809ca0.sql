-- Update lunch menu items with working uploaded images
-- Using the food hall image that shows multiple food stalls
UPDATE lunch_menu 
SET image_url = CASE 
    WHEN name = 'The Deli' THEN '/lovable-uploads/07cf4977-efa8-49a9-afac-7a2f8f371569.png'
    WHEN name = 'The Reuben' THEN '/lovable-uploads/07cf4977-efa8-49a9-afac-7a2f8f371569.png'  
    WHEN name = 'The Med' THEN '/lovable-uploads/07cf4977-efa8-49a9-afac-7a2f8f371569.png'
    WHEN name = 'The Capo' THEN '/lovable-uploads/07cf4977-efa8-49a9-afac-7a2f8f371569.png'
    ELSE image_url
END
WHERE category = 'sandwich' AND name IN ('The Deli', 'The Reuben', 'The Med', 'The Capo');