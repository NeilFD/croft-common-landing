-- Create helper functions for computed columns (SECURITY DEFINER to access auth schema)

-- Function to get user email from auth.users
CREATE OR REPLACE FUNCTION public.get_user_email_by_id(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = user_uuid);
END;
$$;

-- Function to get user full name
CREATE OR REPLACE FUNCTION public.get_user_full_name_by_id(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  full_name text;
  subscriber_name text;
  user_email text;
BEGIN
  -- Try to get full name from profiles table
  SELECT TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
  INTO full_name
  FROM public.profiles 
  WHERE user_id = user_uuid
  AND (first_name IS NOT NULL OR last_name IS NOT NULL);
  
  IF full_name IS NOT NULL AND full_name != '' THEN
    RETURN full_name;
  END IF;
  
  -- Fallback to subscriber name matched by email
  SELECT email INTO user_email FROM auth.users WHERE id = user_uuid;
  
  IF user_email IS NOT NULL THEN
    SELECT s.name 
    INTO subscriber_name
    FROM public.subscribers s 
    WHERE s.email = user_email
    AND s.name IS NOT NULL;
    
    IF subscriber_name IS NOT NULL THEN
      RETURN subscriber_name;
    END IF;
  END IF;
  
  -- Final fallback to email as display name
  RETURN user_email;
END;
$$;

-- Add computed columns to push_subscriptions table
ALTER TABLE public.push_subscriptions 
ADD COLUMN user_email text GENERATED ALWAYS AS (
  CASE 
    WHEN user_id IS NOT NULL THEN public.get_user_email_by_id(user_id)
    ELSE NULL
  END
) STORED;

ALTER TABLE public.push_subscriptions 
ADD COLUMN user_full_name text GENERATED ALWAYS AS (
  CASE 
    WHEN user_id IS NOT NULL THEN public.get_user_full_name_by_id(user_id)
    ELSE 'Anonymous User'
  END
) STORED;