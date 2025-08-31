-- Create function to handle first access tracking for Secret Kitchen users
CREATE OR REPLACE FUNCTION public.update_secret_kitchen_first_access(user_email text)
RETURNS TABLE(first_access_at timestamp with time zone, access_expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  access_record RECORD;
  now_timestamp timestamp with time zone := now();
  expiry_timestamp timestamp with time zone := now() + interval '48 hours';
BEGIN
  -- Input validation
  IF user_email IS NULL OR LENGTH(TRIM(user_email)) = 0 THEN
    RAISE EXCEPTION 'Valid email address is required';
  END IF;
  
  -- Get the current access record
  SELECT * INTO access_record 
  FROM public.secret_kitchen_access 
  WHERE email = user_email AND is_active = true;
  
  -- Check if user has access
  IF access_record IS NULL THEN
    RAISE EXCEPTION 'Email not found in access list or inactive';
  END IF;
  
  -- If first_access_at is NULL, this is the first login - set it now
  IF access_record.first_access_at IS NULL THEN
    UPDATE public.secret_kitchen_access 
    SET 
      first_access_at = now_timestamp,
      access_expires_at = expiry_timestamp,
      updated_at = now_timestamp
    WHERE email = user_email AND is_active = true;
    
    -- Return the new timestamps
    RETURN QUERY SELECT now_timestamp, expiry_timestamp;
  ELSE
    -- Return existing timestamps
    RETURN QUERY SELECT access_record.first_access_at, access_record.access_expires_at;
  END IF;
END;
$function$;

-- Create function to check if user's access has expired
CREATE OR REPLACE FUNCTION public.check_secret_kitchen_access_status(user_email text)
RETURNS TABLE(
  has_access boolean,
  is_expired boolean,
  first_access_at timestamp with time zone,
  access_expires_at timestamp with time zone,
  time_remaining_seconds bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  access_record RECORD;
  current_time timestamp with time zone := now();
BEGIN
  -- Input validation
  IF user_email IS NULL OR LENGTH(TRIM(user_email)) = 0 THEN
    RETURN QUERY SELECT false, true, null::timestamp with time zone, null::timestamp with time zone, 0::bigint;
    RETURN;
  END IF;
  
  -- Get the access record
  SELECT * INTO access_record 
  FROM public.secret_kitchen_access 
  WHERE email = user_email AND is_active = true;
  
  -- If no access record found
  IF access_record IS NULL THEN
    RETURN QUERY SELECT false, true, null::timestamp with time zone, null::timestamp with time zone, 0::bigint;
    RETURN;
  END IF;
  
  -- If first access hasn't been set yet, user has access and is not expired
  IF access_record.first_access_at IS NULL THEN
    RETURN QUERY SELECT true, false, null::timestamp with time zone, null::timestamp with time zone, 172800::bigint; -- 48 hours in seconds
    RETURN;
  END IF;
  
  -- Check if access has expired
  IF access_record.access_expires_at IS NOT NULL AND current_time > access_record.access_expires_at THEN
    RETURN QUERY SELECT true, true, access_record.first_access_at, access_record.access_expires_at, 0::bigint;
    RETURN;
  END IF;
  
  -- Calculate remaining time
  DECLARE
    remaining_seconds bigint := 0;
  BEGIN
    IF access_record.access_expires_at IS NOT NULL THEN
      remaining_seconds := EXTRACT(EPOCH FROM (access_record.access_expires_at - current_time))::bigint;
      remaining_seconds := GREATEST(remaining_seconds, 0);
    END IF;
    
    RETURN QUERY SELECT true, false, access_record.first_access_at, access_record.access_expires_at, remaining_seconds;
  END;
END;
$function$;