-- Create app settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for app_settings (only system access)
CREATE POLICY "System only access" ON public.app_settings
  FOR ALL USING (false);

-- Insert required settings for welcome email functionality
INSERT INTO public.app_settings (key, value) VALUES 
  ('supabase_url', 'https://xccidvoxhpgcnwinnyin.supabase.co'),
  ('service_role_key', 'PLACEHOLDER_FOR_SERVICE_ROLE_KEY')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Create function to get app setting
CREATE OR REPLACE FUNCTION public.get_app_setting(setting_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT value FROM public.app_settings WHERE key = setting_key);
END;
$$;

-- Create function to send welcome email after email verification
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  welcome_payload JSONB;
BEGIN
  -- Only proceed if email_confirmed_at changed from NULL to a timestamp
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
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
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for email verification
DROP TRIGGER IF EXISTS on_email_verified ON auth.users;
CREATE TRIGGER on_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email_on_verification();