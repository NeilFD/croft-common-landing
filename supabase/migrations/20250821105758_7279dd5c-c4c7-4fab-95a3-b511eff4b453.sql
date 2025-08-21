-- Create table to link WebAuthn user handles to Supabase user IDs
CREATE TABLE public.webauthn_user_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_handle TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.webauthn_user_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "System can manage webauthn user links" 
ON public.webauthn_user_links 
FOR ALL 
USING (false);