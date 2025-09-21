-- Add membership card columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS membership_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS wallet_pass_url TEXT,
ADD COLUMN IF NOT EXISTS wallet_pass_last_issued_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS wallet_pass_revoked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS square_customer_id TEXT;

-- Create function to generate unique membership numbers
CREATE OR REPLACE FUNCTION public.generate_membership_number()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT;
  attempt_count INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  LOOP
    -- Generate CC-XXXX-XXXX format
    result := 'CC-' || 
              substr(chars, floor(random() * length(chars) + 1)::int, 1) ||
              substr(chars, floor(random() * length(chars) + 1)::int, 1) ||
              substr(chars, floor(random() * length(chars) + 1)::int, 1) ||
              substr(chars, floor(random() * length(chars) + 1)::int, 1) ||
              '-' ||
              substr(chars, floor(random() * length(chars) + 1)::int, 1) ||
              substr(chars, floor(random() * length(chars) + 1)::int, 1) ||
              substr(chars, floor(random() * length(chars) + 1)::int, 1) ||
              substr(chars, floor(random() * length(chars) + 1)::int, 1);
    
    -- Check if this number already exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE membership_number = result) THEN
      RETURN result;
    END IF;
    
    attempt_count := attempt_count + 1;
    IF attempt_count >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique membership number after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to ensure user has membership number
CREATE OR REPLACE FUNCTION public.ensure_membership_number(user_id_input UUID)
RETURNS TEXT AS $$
DECLARE
  existing_number TEXT;
  new_number TEXT;
BEGIN
  -- Check if user already has a membership number
  SELECT membership_number INTO existing_number 
  FROM public.profiles 
  WHERE user_id = user_id_input;
  
  IF existing_number IS NOT NULL THEN
    RETURN existing_number;
  END IF;
  
  -- Generate new membership number
  new_number := public.generate_membership_number();
  
  -- Update the user's profile
  UPDATE public.profiles 
  SET membership_number = new_number 
  WHERE user_id = user_id_input;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get membership card details
CREATE OR REPLACE FUNCTION public.get_membership_card_details(user_id_input UUID)
RETURNS TABLE(
  membership_number TEXT,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  wallet_pass_url TEXT,
  wallet_pass_last_issued_at TIMESTAMPTZ,
  wallet_pass_revoked BOOLEAN,
  member_since DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.membership_number,
    COALESCE(mp.display_name, CONCAT(p.first_name, ' ', p.last_name)) as display_name,
    p.first_name,
    p.last_name,
    p.wallet_pass_url,
    p.wallet_pass_last_issued_at,
    p.wallet_pass_revoked,
    mp.join_date as member_since
  FROM public.profiles p
  LEFT JOIN public.member_profiles_extended mp ON p.user_id = mp.user_id
  WHERE p.user_id = user_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;