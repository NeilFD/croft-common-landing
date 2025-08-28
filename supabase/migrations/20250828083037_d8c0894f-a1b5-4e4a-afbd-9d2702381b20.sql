-- Create database trigger for automatic AI moderation of member moments
-- This will ensure ALL uploads get moderated, including admin uploads

-- First, create a function that calls the moderate-moment-image edge function
CREATE OR REPLACE FUNCTION public.trigger_ai_moderation()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Get the required configuration
  SELECT value INTO supabase_url FROM public.app_settings WHERE key = 'supabase_url';
  SELECT value INTO service_role_key FROM public.app_settings WHERE key = 'service_role_key';
  
  -- Only proceed if we have valid configuration
  IF supabase_url IS NOT NULL AND service_role_key IS NOT NULL AND service_role_key != 'PLACEHOLDER_FOR_SERVICE_ROLE_KEY' THEN
    -- Call the AI moderation function asynchronously
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/moderate-moment-image',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'imageUrl', NEW.image_url,
        'momentId', NEW.id
      )
    );
    
    -- Log that moderation was triggered
    RAISE NOTICE 'AI moderation triggered for moment %', NEW.id;
  ELSE
    -- Log configuration issue and mark for manual review
    RAISE WARNING 'AI moderation not configured properly, marking moment % for manual review', NEW.id;
    NEW.moderation_status := 'needs_review';
    NEW.moderation_reason := 'AI moderation service not configured';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that fires on INSERT to member_moments
DROP TRIGGER IF EXISTS trigger_ai_moderation_on_insert ON public.member_moments;
CREATE TRIGGER trigger_ai_moderation_on_insert
  AFTER INSERT ON public.member_moments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_ai_moderation();

-- Update the auto_approve_admin_moments function to remove auto-approval
-- All moments should go through AI moderation first
CREATE OR REPLACE FUNCTION public.auto_approve_admin_moments()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove auto-approval even for admins
  -- Let AI moderation handle all content
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure all queries only show approved and visible moments
-- Update any existing RLS policies if needed
-- (The existing policies already handle this correctly)