-- Fix the search path for trigger function
CREATE OR REPLACE FUNCTION trigger_moderate_moment()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the moderation function in the background
  PERFORM pg_notify('moderate_moment', json_build_object(
    'moment_id', NEW.id,
    'image_url', NEW.image_url
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';