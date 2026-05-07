-- Add remaining missing columns for CMS tables

ALTER TABLE public.cms_design_tokens 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.cms_faq_content 
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;

ALTER TABLE public.cms_content 
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Make cms_global_content.key nullable since some inserts don't include it
ALTER TABLE public.cms_global_content 
ALTER COLUMN key DROP NOT NULL;

-- Make cms_menu_items.price nullable since some inserts may not include it
ALTER TABLE public.cms_menu_items 
ALTER COLUMN price DROP NOT NULL;

-- Add missing columns for notifications table used by notification_deliveries
ALTER TABLE public.notification_deliveries 
ADD COLUMN IF NOT EXISTS campaign_id UUID;