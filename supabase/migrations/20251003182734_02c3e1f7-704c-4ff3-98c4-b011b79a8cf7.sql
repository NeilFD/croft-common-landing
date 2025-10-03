-- Ensure non-null defaults for management_profiles to prevent NOT NULL violations from upstream triggers/inserts
CREATE OR REPLACE FUNCTION public.ensure_management_profile_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Normalise email
  NEW.email := lower(trim(coalesce(NEW.email, '')));
  IF NEW.email = '' THEN
    RAISE EXCEPTION 'Email required for management profile';
  END IF;

  -- Ensure user_name present
  IF NEW.user_name IS NULL OR btrim(NEW.user_name) = '' THEN
    NEW.user_name := NEW.email; -- fallback to email
  ELSE
    NEW.user_name := btrim(NEW.user_name);
  END IF;

  -- Ensure job_title present
  IF NEW.job_title IS NULL OR btrim(NEW.job_title) = '' THEN
    NEW.job_title := 'Unknown';
  ELSE
    NEW.job_title := btrim(NEW.job_title);
  END IF;

  RETURN NEW;
END;
$$;

-- Add BEFORE INSERT/UPDATE trigger to apply defaults and avoid NOT NULL errors
DROP TRIGGER IF EXISTS ensure_management_profile_defaults ON public.management_profiles;
CREATE TRIGGER ensure_management_profile_defaults
BEFORE INSERT OR UPDATE ON public.management_profiles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_management_profile_defaults();