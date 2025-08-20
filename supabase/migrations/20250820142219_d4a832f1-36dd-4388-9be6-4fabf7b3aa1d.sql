-- Clean up old webauthn challenges
DELETE FROM webauthn_challenges WHERE created_at < NOW() - INTERVAL '1 hour';

-- Create a function to automatically clean up expired challenges
CREATE OR REPLACE FUNCTION public.cleanup_expired_webauthn_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete challenges older than 10 minutes (WebAuthn spec allows 5-10 minutes)
  DELETE FROM webauthn_challenges WHERE created_at < NOW() - INTERVAL '10 minutes';
END;
$$;

-- Create a trigger to automatically cleanup challenges before inserting new ones
CREATE OR REPLACE FUNCTION public.trigger_cleanup_webauthn_challenges()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clean up old challenges before inserting new ones
  PERFORM public.cleanup_expired_webauthn_challenges();
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS cleanup_webauthn_challenges_on_insert ON webauthn_challenges;

-- Create trigger to auto-cleanup on new challenge insertion
CREATE TRIGGER cleanup_webauthn_challenges_on_insert
  BEFORE INSERT ON webauthn_challenges
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_cleanup_webauthn_challenges();