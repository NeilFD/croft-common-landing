-- Update lunch menu items with the correct sandwich images
UPDATE lunch_menu 
SET image_url = CASE 
    WHEN name = 'The Reuben' THEN '/lovable-uploads/38b44201-be3e-4d61-9d3e-39fdb33bfca4.png'
    WHEN name = 'The Deli' THEN '/lovable-uploads/15171a3b-1af4-4f2a-bfeb-5e2639e91717.png'  
    WHEN name = 'The Capo' THEN '/lovable-uploads/c64e7e60-ffa9-4d4a-be1b-9f2422032365.png'
    WHEN name = 'The Med' THEN '/lovable-uploads/8a7d1a8c-9c52-4a54-b370-ae82f94f5124.png'
    ELSE image_url
END
WHERE category = 'sandwich' AND name IN ('The Reuben', 'The Deli', 'The Capo', 'The Med');