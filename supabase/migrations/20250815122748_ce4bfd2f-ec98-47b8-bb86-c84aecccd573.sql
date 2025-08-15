-- Remove the problematic trigger that's preventing email verification
DROP TRIGGER IF EXISTS email_verification_trigger ON auth.users;

-- Remove the function that was causing the configuration parameter error
DROP FUNCTION IF EXISTS public.handle_email_verification();

-- Create a simple trigger that just logs when email is verified (optional)
CREATE OR REPLACE FUNCTION public.log_email_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only proceed if email_confirmed_at was just set (changed from null to a timestamp)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Simple logging without HTTP calls that can fail
    INSERT INTO public.notification_deliveries (
      notification_id, 
      endpoint, 
      status, 
      sent_at
    ) VALUES (
      gen_random_uuid(),
      'email-verified-' || NEW.email,
      'logged',
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the new trigger for email verification logging
CREATE TRIGGER email_verification_log_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_email_verification();