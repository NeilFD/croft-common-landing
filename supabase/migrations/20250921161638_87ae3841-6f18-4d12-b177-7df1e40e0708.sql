-- Fix the get_membership_card_details function to cast join_date to date
CREATE OR REPLACE FUNCTION public.get_membership_card_details(user_id_input uuid)
RETURNS TABLE(membership_number text, display_name text, first_name text, last_name text, wallet_pass_url text, wallet_pass_last_issued_at timestamp with time zone, wallet_pass_revoked boolean, member_since date)
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
    mp.join_date::date as member_since  -- Cast to date to match return type
  FROM public.profiles p
  LEFT JOIN public.member_profiles_extended mp ON p.user_id = mp.user_id
  WHERE p.user_id = user_id_input;
END;
$function$;