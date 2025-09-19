-- Drop the old version of get_advanced_member_analytics function to resolve function overload conflict
DROP FUNCTION IF EXISTS public.get_advanced_member_analytics(
  p_date_start date, 
  p_date_end date, 
  p_min_age integer, 
  p_max_age integer, 
  p_interests text[], 
  p_venue_slugs text[], 
  p_min_spend numeric, 
  p_max_spend numeric, 
  p_tier_badges text[]
);