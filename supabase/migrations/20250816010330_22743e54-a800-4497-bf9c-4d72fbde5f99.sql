-- Clean up duplicate images first, keeping only the oldest record for each combination
DELETE FROM public.cms_images 
WHERE id NOT IN (
  SELECT DISTINCT ON (image_url, page, carousel_name) id
  FROM public.cms_images 
  ORDER BY image_url, page, carousel_name, created_at ASC
);

-- Now add the unique constraint for images
ALTER TABLE public.cms_images 
ADD CONSTRAINT cms_images_unique_url_page_carousel 
UNIQUE (image_url, page, carousel_name);