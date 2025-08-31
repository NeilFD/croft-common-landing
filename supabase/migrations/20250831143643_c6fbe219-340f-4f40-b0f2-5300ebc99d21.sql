-- Add user type metadata for segregation
-- Update profiles table to include user type
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'main_site',
ADD COLUMN IF NOT EXISTS secret_kitchens_access BOOLEAN DEFAULT false;

-- Create function to check if user is secret kitchens user
CREATE OR REPLACE FUNCTION public.is_secret_kitchens_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND user_type = 'secret_kitchens'
  );
END;
$$;

-- Create function to get user type
CREATE OR REPLACE FUNCTION public.get_user_type()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (
    SELECT user_type FROM public.profiles 
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Update the handle_new_user function to support user type tagging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
DECLARE
  user_type_value text := 'main_site';
  sk_access boolean := false;
BEGIN
  -- Check if user metadata indicates this is a secret kitchens user
  IF new.raw_user_meta_data ? 'user_type' AND 
     new.raw_user_meta_data ->> 'user_type' = 'secret_kitchens' THEN
    user_type_value := 'secret_kitchens';
    sk_access := true;
  END IF;

  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    last_name,
    user_type,
    secret_kitchens_access
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'first_name', 
    new.raw_user_meta_data ->> 'last_name',
    user_type_value,
    sk_access
  );
  
  RETURN new;
END;
$$;

-- Add RLS policy for secret kitchens users to access their own data
CREATE POLICY "Secret kitchens users can view their own profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id AND 
  user_type = 'secret_kitchens'
);

CREATE POLICY "Secret kitchens users can update their own profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = user_id AND 
  user_type = 'secret_kitchens'
);

-- Function to validate secret kitchen access with user type check
CREATE OR REPLACE FUNCTION public.validate_secret_kitchen_user(user_email text)
RETURNS TABLE(has_access boolean, user_type text, is_verified boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  access_record RECORD;
  profile_record RECORD;
BEGIN
  -- Input validation
  IF user_email IS NULL OR LENGTH(TRIM(user_email)) = 0 THEN
    RETURN QUERY SELECT false, 'none'::text, false;
    RETURN;
  END IF;
  
  -- Check if email is in secret kitchen access list
  SELECT * INTO access_record 
  FROM public.secret_kitchen_access 
  WHERE email = user_email AND is_active = true;
  
  -- Check user profile if auth user exists
  SELECT * INTO profile_record
  FROM public.profiles p
  INNER JOIN auth.users u ON u.id = p.user_id
  WHERE u.email = user_email;
  
  -- If user has profile and is secret kitchens type
  IF profile_record IS NOT NULL AND profile_record.user_type = 'secret_kitchens' THEN
    RETURN QUERY SELECT true, 'secret_kitchens'::text, true;
    RETURN;
  END IF;
  
  -- If email is authorized but no profile yet (new user)
  IF access_record IS NOT NULL THEN
    RETURN QUERY SELECT true, 'pending'::text, false;
    RETURN;
  END IF;
  
  -- No access
  RETURN QUERY SELECT false, 'none'::text, false;
END;
$$;