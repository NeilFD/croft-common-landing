-- Create a function to send welcome email after email verification
CREATE OR REPLACE FUNCTION public.handle_email_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_email text;
  user_metadata jsonb;
  subscriber_record record;
BEGIN
  -- Only proceed if email_confirmed_at was just set (changed from null to a timestamp)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Get user email and metadata
    user_email := NEW.email;
    user_metadata := NEW.raw_user_meta_data;
    
    -- Find the corresponding subscriber record
    SELECT * INTO subscriber_record 
    FROM public.subscribers 
    WHERE email = user_email AND is_active = true;
    
    -- If subscriber exists, send welcome email
    IF subscriber_record.id IS NOT NULL THEN
      -- Call the send-welcome-email function via HTTP request
      PERFORM
        net.http_post(
          url := current_setting('app.settings.supabase_url') || '/functions/v1/send-welcome-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
          ),
          body := jsonb_build_object(
            'email', user_email,
            'name', subscriber_record.name,
            'firstName', user_metadata->>'first_name',
            'subscriberId', subscriber_record.id,
            'userId', NEW.id
          )
        );
        
      -- Log the welcome email sending
      INSERT INTO public.notification_deliveries (
        notification_id, 
        endpoint, 
        status, 
        sent_at
      ) VALUES (
        gen_random_uuid(),
        'welcome-email-' || user_email,
        'sent',
        now()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table for email verification
DROP TRIGGER IF EXISTS on_email_verified ON auth.users;
CREATE TRIGGER on_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_email_verification();