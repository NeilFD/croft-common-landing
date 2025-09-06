-- Add cityandsanctuary.com domain to allowed domains for admin access
INSERT INTO public.allowed_domains (domain) 
VALUES ('cityandsanctuary.com')
ON CONFLICT (domain) DO NOTHING;