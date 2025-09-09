-- Remove the incorrect image URLs from lunch menu items and set them to NULL temporarily
UPDATE lunch_menu 
SET image_url = NULL
WHERE category = 'sandwich' AND name IN ('The Deli', 'The Reuben', 'The Med', 'The Capo');