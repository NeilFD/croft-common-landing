-- Fix ledger password function to use basic hashing without digest function
CREATE OR REPLACE FUNCTION public.set_ledger_password(user_id_input uuid, password_input text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  salt_value TEXT;
  hash_result TEXT;
BEGIN
  -- Generate random salt using gen_random_uuid()
  salt_value := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  
  -- Use md5 hash instead of digest function (md5 is built into PostgreSQL)
  hash_result := md5(password_input || salt_value);
  
  -- Upsert password record
  INSERT INTO public.ledger_passwords (user_id, password_hash, salt)
  VALUES (user_id_input, hash_result, salt_value)
  ON CONFLICT (user_id) DO UPDATE SET
    password_hash = hash_result,
    salt = salt_value,
    updated_at = NOW(),
    failed_attempts = 0,
    locked_until = NULL;
  
  RETURN true;
END;
$function$;

-- Also update the validation function to use md5
CREATE OR REPLACE FUNCTION public.validate_ledger_password(user_id_input uuid, password_input text)
 RETURNS TABLE(valid boolean, locked boolean, locked_until timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  stored_record RECORD;
  hash_result TEXT;
BEGIN
  -- Get stored password data
  SELECT * INTO stored_record 
  FROM public.ledger_passwords 
  WHERE user_id = user_id_input;
  
  -- If no password set, return invalid
  IF stored_record IS NULL THEN
    RETURN QUERY SELECT false, false, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  -- Check if account is locked
  IF stored_record.locked_until IS NOT NULL AND stored_record.locked_until > NOW() THEN
    RETURN QUERY SELECT false, true, stored_record.locked_until;
    RETURN;
  END IF;
  
  -- Hash the input password with stored salt using md5
  hash_result := md5(password_input || stored_record.salt);
  
  -- Check if password matches
  IF hash_result = stored_record.password_hash THEN
    -- Reset failed attempts and update last accessed
    UPDATE public.ledger_passwords 
    SET failed_attempts = 0, 
        locked_until = NULL,
        last_accessed = NOW()
    WHERE user_id = user_id_input;
    
    RETURN QUERY SELECT true, false, NULL::TIMESTAMP WITH TIME ZONE;
  ELSE
    -- Increment failed attempts
    UPDATE public.ledger_passwords 
    SET failed_attempts = failed_attempts + 1,
        locked_until = CASE 
          WHEN failed_attempts >= 4 THEN NOW() + INTERVAL '30 minutes'
          ELSE locked_until
        END
    WHERE user_id = user_id_input;
    
    RETURN QUERY SELECT false, false, NULL::TIMESTAMP WITH TIME ZONE;
  END IF;
END;
$function$