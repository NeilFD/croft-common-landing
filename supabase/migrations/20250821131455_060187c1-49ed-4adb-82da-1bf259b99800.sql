-- Fix inconsistent URL format for fifth hero image
UPDATE cms_images 
SET image_url = '/lovable-uploads/1755446063415-hxfysvn3fu7.jpeg' 
WHERE id = 'edb017ea-e266-4445-8c02-8cdca9a6590e' 
  AND page = 'index' 
  AND carousel_name = 'main_hero';