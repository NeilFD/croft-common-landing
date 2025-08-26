-- Add computed columns to push_subscriptions table for user display names and emails

-- Add user_email computed column
ALTER TABLE public.push_subscriptions 
ADD COLUMN user_email text GENERATED ALWAYS AS (
  CASE 
    WHEN user_id IS NOT NULL THEN (
      SELECT email FROM auth.users WHERE id = user_id
    )
    ELSE NULL
  END
) STORED;

-- Add user_full_name computed column  
ALTER TABLE public.push_subscriptions 
ADD COLUMN user_full_name text GENERATED ALWAYS AS (
  CASE 
    WHEN user_id IS NOT NULL THEN (
      COALESCE(
        -- Try to get full name from profiles table
        (SELECT TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) 
         FROM public.profiles 
         WHERE user_id = push_subscriptions.user_id
         AND (first_name IS NOT NULL OR last_name IS NOT NULL)),
        -- Fallback to subscriber name matched by email
        (SELECT s.name 
         FROM public.subscribers s 
         WHERE s.email = (SELECT email FROM auth.users WHERE id = push_subscriptions.user_id)
         AND s.name IS NOT NULL),
        -- Final fallback to email as display name
        (SELECT email FROM auth.users WHERE id = push_subscriptions.user_id)
      )
    )
    ELSE 'Anonymous User'
  END
) STORED;