UPDATE public.cms_images
SET image_url = REPLACE(image_url, '/src/assets/', '/cms/')
WHERE image_url LIKE '/src/assets/%';