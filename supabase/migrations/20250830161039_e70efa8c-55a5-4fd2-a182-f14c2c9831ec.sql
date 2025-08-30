-- Create secret kitchen access table
CREATE TABLE public.secret_kitchen_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create secret kitchen usage tracking table
CREATE TABLE public.secret_kitchen_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT
);

-- Enable RLS on both tables
ALTER TABLE public.secret_kitchen_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_kitchen_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for secret_kitchen_access table
-- Only neil@cityandsanctuary.com can access
CREATE POLICY "Only Neil can view secret kitchen access"
ON public.secret_kitchen_access
FOR SELECT
USING (get_user_email() = 'neil@cityandsanctuary.com');

CREATE POLICY "Only Neil can insert secret kitchen access"
ON public.secret_kitchen_access
FOR INSERT
WITH CHECK (get_user_email() = 'neil@cityandsanctuary.com' AND auth.uid() = created_by);

CREATE POLICY "Only Neil can update secret kitchen access"
ON public.secret_kitchen_access
FOR UPDATE
USING (get_user_email() = 'neil@cityandsanctuary.com');

CREATE POLICY "Only Neil can delete secret kitchen access"
ON public.secret_kitchen_access
FOR DELETE
USING (get_user_email() = 'neil@cityandsanctuary.com');

-- Create policies for secret_kitchen_usage table
CREATE POLICY "Only Neil can view secret kitchen usage"
ON public.secret_kitchen_usage
FOR SELECT
USING (get_user_email() = 'neil@cityandsanctuary.com');

CREATE POLICY "Service role can insert usage tracking"
ON public.secret_kitchen_usage
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at on secret_kitchen_access
CREATE TRIGGER update_secret_kitchen_access_updated_at
BEFORE UPDATE ON public.secret_kitchen_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();