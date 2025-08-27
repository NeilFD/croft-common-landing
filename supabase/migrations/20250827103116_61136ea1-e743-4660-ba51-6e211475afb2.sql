-- Create automatic moderation trigger for member moments
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically moderate new moments
CREATE TRIGGER on_moment_insert_moderate
  AFTER INSERT ON member_moments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_moderate_moment();