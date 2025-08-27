-- Fix the search path security warnings
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN is_email_domain_allowed(get_user_email());
END;
$$;

-- Fix search path for auto approval function
CREATE OR REPLACE FUNCTION public.auto_approve_admin_moments()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the user is an admin, auto-approve their moments
  IF is_admin_user() THEN
    NEW.moderation_status := 'approved';
    NEW.moderated_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;