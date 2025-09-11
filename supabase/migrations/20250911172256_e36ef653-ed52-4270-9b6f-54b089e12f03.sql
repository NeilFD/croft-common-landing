-- Fix the 4th home hero image to match the correct URL from fallback data
UPDATE public.cms_images
SET image_url = '/lovable-uploads/ae7e9f85-42b7-459a-8387-d57b2b637edc.png',
    updated_at = now()
WHERE page = 'index'
  AND carousel_name = 'main_hero'
  AND sort_order = 3;