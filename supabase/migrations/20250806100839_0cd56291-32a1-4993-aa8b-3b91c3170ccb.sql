-- Create allowed domains table
CREATE TABLE public.allowed_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert the allowed domains
INSERT INTO public.allowed_domains (domain) VALUES 
  ('cityandsanctuary.com'),
  ('croftcommon.com');

-- Create function to validate email domains
CREATE OR REPLACE FUNCTION public.is_email_domain_allowed(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.allowed_domains 
    WHERE domain = SPLIT_PART(email, '@', 2)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to get user email from auth
CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update RLS policies to include domain validation
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;
DROP POLICY IF EXISTS "Users can create their own events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;

CREATE POLICY "Users can view their own events" 
ON public.events 
FOR SELECT 
USING (auth.uid() = user_id AND public.is_email_domain_allowed(public.get_user_email()));

CREATE POLICY "Users can create their own events" 
ON public.events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND public.is_email_domain_allowed(public.get_user_email()));

CREATE POLICY "Users can update their own events" 
ON public.events 
FOR UPDATE 
USING (auth.uid() = user_id AND public.is_email_domain_allowed(public.get_user_email()));

CREATE POLICY "Users can delete their own events" 
ON public.events 
FOR DELETE 
USING (auth.uid() = user_id AND public.is_email_domain_allowed(public.get_user_email()));