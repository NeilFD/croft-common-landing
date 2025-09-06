-- Create ledger_passwords table for member ledger access control
CREATE TABLE public.ledger_passwords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed TIMESTAMP WITH TIME ZONE,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.ledger_passwords ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ledger_passwords
CREATE POLICY "Users can manage their own ledger password"
ON public.ledger_passwords
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create password reset tokens table
CREATE TABLE public.ledger_password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ledger_password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reset tokens
CREATE POLICY "Users can view their own reset tokens"
ON public.ledger_password_reset_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- Add updated_at trigger for ledger_passwords
CREATE TRIGGER update_ledger_passwords_updated_at
BEFORE UPDATE ON public.ledger_passwords
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enhanced member_ledger table for better analytics
ALTER TABLE public.member_ledger 
ADD COLUMN IF NOT EXISTS location_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS transaction_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create admin analytics view for comprehensive member spending analysis
CREATE VIEW public.admin_member_analytics AS
SELECT 
  ml.user_id,
  p.first_name,
  p.last_name,
  COALESCE(mp.display_name, CONCAT(p.first_name, ' ', p.last_name)) as display_name,
  COUNT(*) as total_transactions,
  SUM(CASE WHEN ml.amount > 0 THEN ml.amount ELSE 0 END) as total_spend,
  AVG(CASE WHEN ml.amount > 0 THEN ml.amount ELSE NULL END) as avg_transaction,
  MIN(ml.activity_date) as first_transaction_date,
  MAX(ml.activity_date) as last_transaction_date,
  COUNT(DISTINCT DATE_TRUNC('month', ml.activity_date)) as active_months,
  COUNT(DISTINCT ml.activity_date) as active_days,
  ARRAY_AGG(DISTINCT ml.category) FILTER (WHERE ml.category IS NOT NULL) as categories,
  ARRAY_AGG(DISTINCT ml.payment_method) FILTER (WHERE ml.payment_method IS NOT NULL) as payment_methods,
  ml.currency,
  SUM(CASE WHEN ml.activity_date >= DATE_TRUNC('month', NOW()) THEN ml.amount ELSE 0 END) as current_month_spend,
  SUM(CASE WHEN ml.activity_date >= DATE_TRUNC('week', NOW()) THEN ml.amount ELSE 0 END) as current_week_spend,
  COUNT(CASE WHEN ml.activity_date >= DATE_TRUNC('month', NOW()) THEN 1 END) as current_month_transactions
FROM public.member_ledger ml
LEFT JOIN public.profiles p ON p.user_id = ml.user_id
LEFT JOIN public.member_profiles_extended mp ON mp.user_id = ml.user_id
WHERE ml.amount IS NOT NULL
GROUP BY ml.user_id, p.first_name, p.last_name, mp.display_name, ml.currency;

-- Admin can view analytics
CREATE POLICY "Admins can view member analytics"
ON public.admin_member_analytics
FOR SELECT
USING (is_email_domain_allowed(get_user_email()));

-- Create function to validate ledger password
CREATE OR REPLACE FUNCTION public.validate_ledger_password(user_id_input UUID, password_input TEXT)
RETURNS TABLE(valid BOOLEAN, locked BOOLEAN, locked_until TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  
  -- Hash the input password with stored salt
  hash_result := encode(digest(password_input || stored_record.salt, 'sha256'), 'hex');
  
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
$$;

-- Create function to set ledger password
CREATE OR REPLACE FUNCTION public.set_ledger_password(user_id_input UUID, password_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  salt_value TEXT;
  hash_result TEXT;
BEGIN
  -- Generate random salt
  salt_value := encode(gen_random_bytes(32), 'hex');
  
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
$$;