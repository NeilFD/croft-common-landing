-- Add portlandbrown.com to allowed domains for admin access
INSERT INTO public.allowed_domains (domain) 
VALUES ('portlandbrown.com')
ON CONFLICT (domain) DO NOTHING;