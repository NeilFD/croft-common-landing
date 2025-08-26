-- Enable Row Level Security on allowed_domains table
ALTER TABLE public.allowed_domains ENABLE ROW LEVEL SECURITY;

-- Create policy to allow system admins to manage allowed domains
-- Only users with allowed email domains can view and manage the allowed_domains table
CREATE POLICY "Allowed domain users can view domains" 
ON public.allowed_domains 
FOR SELECT 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Allowed domain users can insert domains" 
ON public.allowed_domains 
FOR INSERT 
WITH CHECK (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Allowed domain users can update domains" 
ON public.allowed_domains 
FOR UPDATE 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Allowed domain users can delete domains" 
ON public.allowed_domains 
FOR DELETE 
USING (is_email_domain_allowed(get_user_email()));

-- Add a comment to document the security fix
COMMENT ON TABLE public.allowed_domains IS 'Controls which email domains can access CMS features. RLS enabled for security.';