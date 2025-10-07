-- Add 'upload' to the allowed link_type values for client_inspiration_links
ALTER TABLE public.client_inspiration_links 
DROP CONSTRAINT IF EXISTS client_inspiration_links_link_type_check;

ALTER TABLE public.client_inspiration_links 
ADD CONSTRAINT client_inspiration_links_link_type_check 
CHECK (link_type = ANY (ARRAY['instagram'::text, 'pinterest'::text, 'web'::text, 'upload'::text]));