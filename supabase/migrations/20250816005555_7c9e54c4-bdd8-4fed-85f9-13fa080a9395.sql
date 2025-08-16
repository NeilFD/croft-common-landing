-- Add unique constraint for brand assets upsert functionality
ALTER TABLE public.cms_brand_assets 
ADD CONSTRAINT cms_brand_assets_unique_key_type 
UNIQUE (asset_key, asset_type);