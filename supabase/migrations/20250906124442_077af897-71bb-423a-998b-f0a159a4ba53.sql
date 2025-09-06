-- Fix the ledger password function to use an alternative to gen_random_bytes
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
  -- Generate random salt using gen_random_uuid() instead of gen_random_bytes
  salt_value := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  
  -- Hash password with salt
  hash_result := encode(digest(password_input || salt_value, 'sha256'), 'hex');
  
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
$function$