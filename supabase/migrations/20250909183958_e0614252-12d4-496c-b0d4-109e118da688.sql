-- Update lunch menu items with sandwich images
-- Adding image URLs for the sandwich items

UPDATE lunch_menu 
SET image_url = CASE 
    WHEN name = 'The Deli' THEN '/lovable-uploads/8d8d498c-d657-401a-a8fe-eb281eb22811.png'
    WHEN name = 'The Reuben' THEN '/lovable-uploads/8d8d498c-d657-401a-a8fe-eb281eb22811.png'  
    WHEN name = 'The Med' THEN '/lovable-uploads/8d8d498c-d657-401a-a8fe-eb281eb22811.png'
    WHEN name = 'The Capo' THEN '/lovable-uploads/8d8d498c-d657-401a-a8fe-eb281eb22811.png'
    ELSE image_url
END
WHERE category = 'sandwich' AND name IN ('The Deli', 'The Reuben', 'The Med', 'The Capo');