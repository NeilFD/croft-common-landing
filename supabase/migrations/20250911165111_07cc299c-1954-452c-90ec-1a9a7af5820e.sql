-- Update the 4th CMS image to use the correct uploaded image
UPDATE cms_images 
SET image_url = '/lovable-uploads/ae7e9f85-42b7-459a-8387-d57b2b637edc.png',
    metadata = jsonb_build_object(
      'type', 'mixed',
      'overlay', 'bg-void/25'
    )
WHERE page = 'home' 
  AND carousel_name = 'hero' 
  AND sort_order = 4;

-- Unpublish the problematic 5th image (JPEG)
UPDATE cms_images 
SET published = false
WHERE page = 'home' 
  AND carousel_name = 'hero' 
  AND sort_order = 5;