-- Create management_profiles table with single user_name field
CREATE TABLE IF NOT EXISTS public.management_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  email TEXT NOT NULL,
  job_title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.management_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Management users can view all profiles"
ON public.management_profiles
FOR SELECT
USING (
  get_user_management_role(auth.uid()) IS NOT NULL
);

CREATE POLICY "Users can view their own profile"
ON public.management_profiles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can insert profiles"
ON public.management_profiles
FOR INSERT
WITH CHECK (
  get_user_management_role(auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update all profiles"
ON public.management_profiles
FOR UPDATE
USING (
  get_user_management_role(auth.uid()) = 'admin'
);

CREATE POLICY "Users can update their own profile"
ON public.management_profiles
FOR UPDATE
USING (user_id = auth.uid());

-- Trigger to update updated_at
CREATE TRIGGER update_management_profiles_updated_at
BEFORE UPDATE ON public.management_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RPC function to get management users with profiles
CREATE OR REPLACE FUNCTION public.get_management_users()
RETURNS TABLE(
  user_id UUID,
  user_name TEXT,
  email TEXT,
  job_title TEXT,
  role management_role,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this
  IF get_user_management_role(auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Only admins can view management users';
  END IF;

  RETURN QUERY
  SELECT 
    mp.user_id,
    mp.user_name,
    mp.email,
    mp.job_title,
    ur.role,
    ur.created_at
  FROM public.management_profiles mp
  INNER JOIN public.user_roles ur ON mp.user_id = ur.user_id
  ORDER BY ur.created_at DESC;
END;
$$;

-- RPC function to update own profile
CREATE OR REPLACE FUNCTION public.update_my_management_profile(
  p_user_name TEXT,
  p_job_title TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate inputs
  IF p_user_name IS NULL OR LENGTH(TRIM(p_user_name)) = 0 THEN
    RAISE EXCEPTION 'User name is required';
  END IF;
  
  IF p_job_title IS NULL OR LENGTH(TRIM(p_job_title)) = 0 THEN
    RAISE EXCEPTION 'Job title is required';
  END IF;

  UPDATE public.management_profiles
  SET 
    user_name = TRIM(p_user_name),
    job_title = TRIM(p_job_title),
    updated_at = now()
  WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
END;
$$;