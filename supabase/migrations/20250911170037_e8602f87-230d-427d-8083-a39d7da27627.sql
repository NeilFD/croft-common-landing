-- Unpublish the 5th image in the home hero carousel without touching others
UPDATE public.cms_images
SET published = false, updated_at = now()
WHERE page = 'home'
  AND carousel_name = 'hero'
  AND sort_order = 5
  AND published = true;