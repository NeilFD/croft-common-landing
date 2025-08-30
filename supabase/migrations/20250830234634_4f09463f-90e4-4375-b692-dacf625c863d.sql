-- Add 48-hour countdown columns to secret_kitchen_access table
ALTER TABLE public.secret_kitchen_access 
ADD COLUMN first_access_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN access_expires_at TIMESTAMP WITH TIME ZONE NULL;

-- Add index for efficient expiration checking
CREATE INDEX idx_secret_kitchen_access_expires_at ON public.secret_kitchen_access(access_expires_at);

-- Create function to check if access has expired
CREATE OR REPLACE FUNCTION public.is_secret_kitchen_access_expired(email_input text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Input validation
  IF email_input IS NULL OR LENGTH(TRIM(email_input)) = 0 THEN
    RETURN true;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.secret_kitchen_access 
    WHERE email = email_input 
    AND is_active = true
    AND access_expires_at IS NOT NULL 
    AND access_expires_at < NOW()
  );
END;
$$;