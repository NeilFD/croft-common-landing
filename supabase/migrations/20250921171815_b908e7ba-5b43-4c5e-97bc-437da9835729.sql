-- Add wallet pass tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN wallet_pass_url text,
ADD COLUMN wallet_pass_last_issued_at timestamp with time zone,
ADD COLUMN wallet_pass_revoked boolean DEFAULT false,
ADD COLUMN wallet_pass_serial_number text UNIQUE;

-- Create wallet-passes storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wallet-passes', 'wallet-passes', false);

-- Create storage policies for wallet passes
CREATE POLICY "Users can view their own wallet passes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'wallet-passes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service role can manage wallet passes"
ON storage.objects
FOR ALL
USING (bucket_id = 'wallet-passes' AND auth.role() = 'service_role');

-- Update get_membership_card_details function to include new wallet pass fields
CREATE OR REPLACE FUNCTION public.get_membership_card_details(user_id_input uuid)
RETURNS TABLE(
  membership_number text, 
  display_name text, 
  first_name text, 
  last_name text, 
  wallet_pass_url text, 
  wallet_pass_last_issued_at timestamp with time zone, 
  wallet_pass_revoked boolean, 
  member_since date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    COALESCE(mp.join_date, p.created_at::date) as member_since
  FROM public.profiles p
  LEFT JOIN public.member_profiles_extended mp ON p.user_id = mp.user_id
  WHERE p.user_id = user_id_input;
END;
$function$;