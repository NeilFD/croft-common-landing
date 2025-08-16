-- Add unique constraint for design tokens upsert functionality
ALTER TABLE public.cms_design_tokens 
ADD CONSTRAINT cms_design_tokens_unique_key_type 
UNIQUE (token_key, token_type);

-- Add unique constraint for images to prevent duplicates
ALTER TABLE public.cms_images 
ADD CONSTRAINT cms_images_unique_url_page_carousel 
UNIQUE (image_url, page, carousel_name);