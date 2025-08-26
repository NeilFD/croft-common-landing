-- Fix the security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION public.update_push_subscription_user_info()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  full_name text;
  subscriber_name text;
  user_email text;
BEGIN
  -- Clear values first
  NEW.user_email := NULL;
  NEW.user_full_name := NULL;
  
  -- Only process if user_id is set
  IF NEW.user_id IS NOT NULL THEN
    -- Get user email from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
    NEW.user_email := user_email;
    
    -- Try to get full name from profiles table
    SELECT TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
    INTO full_name
    FROM public.profiles 
    WHERE user_id = NEW.user_id
    AND (first_name IS NOT NULL OR last_name IS NOT NULL);
    
    IF full_name IS NOT NULL AND full_name != '' THEN
      NEW.user_full_name := full_name;
    ELSE
      -- Fallback to subscriber name matched by email
      IF user_email IS NOT NULL THEN
        SELECT s.name 
        INTO subscriber_name
        FROM public.subscribers s 
        WHERE s.email = user_email
        AND s.name IS NOT NULL;
        
        IF subscriber_name IS NOT NULL THEN
          NEW.user_full_name := subscriber_name;
        ELSE
          -- Final fallback to email as display name
          NEW.user_full_name := user_email;
        END IF;
      END IF;
    END IF;
  ELSE
    NEW.user_full_name := 'Anonymous User';
  END IF;
  
  RETURN NEW;
END;
$$;