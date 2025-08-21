-- Modify the welcome email trigger to only send emails for new user signups, not OTP authentication
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  welcome_payload JSONB;
  user_created_recently BOOLEAN := FALSE;
BEGIN
  -- Only proceed if email_confirmed_at changed from NULL to a timestamp
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Check if this user was created recently (within the last 5 minutes)
    -- This helps distinguish between new signups and OTP authentication for existing users
    SELECT (NEW.created_at > NOW() - INTERVAL '5 minutes') INTO user_created_recently;
    
    -- Only send welcome email for recently created users (new signups)
    IF user_created_recently THEN
      -- Get required settings
      SELECT value INTO supabase_url FROM public.app_settings WHERE key = 'supabase_url';
      SELECT value INTO service_role_key FROM public.app_settings WHERE key = 'service_role_key';
      
      -- Only proceed if we have the required settings
      IF supabase_url IS NOT NULL AND service_role_key IS NOT NULL AND service_role_key != 'PLACEHOLDER_FOR_SERVICE_ROLE_KEY' THEN
        
        -- Prepare payload for welcome email
        welcome_payload := jsonb_build_object(
          'email', NEW.email,
          'name', COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.email),
          'subscriberId', NEW.id::text
        );
        
        -- Call the send-welcome-email edge function using pg_net
        PERFORM net.http_post(
          url := supabase_url || '/functions/v1/send-welcome-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_role_key
          ),
          body := welcome_payload
        );
        
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;