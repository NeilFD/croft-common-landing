-- Backfill management_profiles for existing users in user_roles
-- This handles the case where users existed before the management_profiles system was created

-- First, insert your specific profile
INSERT INTO public.management_profiles (user_id, user_name, email, job_title)
VALUES (
  'b049165e-6541-42c2-b5e0-34df019ef7ce',
  'Neil Fincham-Dukes',
  'neil@cityandsanctuary.com',
  'Operations Director'
)
ON CONFLICT (user_id) DO UPDATE
SET 
  user_name = EXCLUDED.user_name,
  email = EXCLUDED.email,
  job_title = EXCLUDED.job_title,
  updated_at = now();

-- Backfill management_profiles for any other existing users in user_roles
-- who don't have a management_profiles entry yet
INSERT INTO public.management_profiles (user_id, user_name, email, job_title)
SELECT 
  ur.user_id,
  COALESCE(
    TRIM(CONCAT(p.first_name, ' ', p.last_name)),
    au.email,
    'Management User'
  ) as user_name,
  au.email,
  NULL as job_title
FROM public.user_roles ur
INNER JOIN auth.users au ON au.id = ur.user_id
LEFT JOIN public.profiles p ON p.user_id = ur.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.management_profiles mp 
  WHERE mp.user_id = ur.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- Create a trigger function to auto-create management_profiles 
-- when users are added to user_roles
CREATE OR REPLACE FUNCTION public.auto_create_management_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  user_full_name TEXT;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = NEW.user_id;
  
  -- Try to get full name from profiles
  SELECT TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) 
  INTO user_full_name
  FROM public.profiles 
  WHERE user_id = NEW.user_id;
  
  -- If no name in profiles, use email
  IF user_full_name IS NULL OR user_full_name = '' THEN
    user_full_name := user_email;
  END IF;
  
  -- Insert into management_profiles if not exists
  INSERT INTO public.management_profiles (user_id, user_name, email, job_title)
  VALUES (NEW.user_id, user_full_name, user_email, NULL)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on user_roles to auto-create management profiles
DROP TRIGGER IF EXISTS auto_create_management_profile_trigger ON public.user_roles;
CREATE TRIGGER auto_create_management_profile_trigger
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_management_profile();