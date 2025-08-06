-- Add thehive-hospitality.com to allowed domains
INSERT INTO public.allowed_domains (domain) VALUES ('thehive-hospitality.com')
ON CONFLICT (domain) DO NOTHING;