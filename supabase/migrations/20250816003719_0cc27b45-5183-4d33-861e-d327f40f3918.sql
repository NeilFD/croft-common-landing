-- Add lovableproject.com to allowed domains for development/testing
INSERT INTO public.allowed_domains (domain) 
VALUES ('lovableproject.com') 
ON CONFLICT (domain) DO NOTHING;