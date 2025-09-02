-- Fix the check_secret_kitchen_access_status function to resolve timestamp comparison issues
CREATE OR REPLACE FUNCTION public.check_secret_kitchen_access_status(user_email text)
 RETURNS TABLE(has_access boolean, is_expired boolean, first_access_at timestamp with time zone, access_expires_at timestamp with time zone, time_remaining_seconds bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  access_record RECORD;
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
  
  -- Check if access has expired - use NOW() directly to avoid type casting issues
  IF access_record.access_expires_at IS NOT NULL AND NOW() > access_record.access_expires_at THEN
    RETURN QUERY SELECT true, true, access_record.first_access_at, access_record.access_expires_at, 0::bigint;
    RETURN;
  END IF;
  
  -- Calculate remaining time
  DECLARE
    remaining_seconds bigint := 0;
  BEGIN
    IF access_record.access_expires_at IS NOT NULL THEN
      remaining_seconds := EXTRACT(EPOCH FROM (access_record.access_expires_at - NOW()))::bigint;
      remaining_seconds := GREATEST(remaining_seconds, 0);
    END IF;
    
    RETURN QUERY SELECT true, false, access_record.first_access_at, access_record.access_expires_at, remaining_seconds;
  END;
END;
$function$;