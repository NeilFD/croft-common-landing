-- Create a wrapper around get_advanced_member_analytics that sanitizes empty arrays
CREATE OR REPLACE FUNCTION public.get_advanced_member_analytics_v2(
  p_date_start date DEFAULT NULL,
  p_date_end date DEFAULT NULL,
  p_min_age integer DEFAULT NULL,
  p_max_age integer DEFAULT NULL,
  p_interests text[] DEFAULT NULL,
  p_interests_logic text DEFAULT 'match_any',
  p_venue_slugs text[] DEFAULT NULL,
  p_venue_logic text DEFAULT 'match_any',
  p_min_spend numeric DEFAULT NULL,
  p_max_spend numeric DEFAULT NULL,
  p_tier_badges text[] DEFAULT NULL,
  p_receipt_activity_period text DEFAULT NULL,
  p_visit_frequency text DEFAULT NULL,
  p_recent_activity text DEFAULT NULL,
  p_activity_logic text DEFAULT 'any_match',
  p_preferred_visit_days text[] DEFAULT NULL,
  p_visit_timing text[] DEFAULT NULL,
  p_avg_spend_per_visit text DEFAULT NULL,
  p_behavior_logic text DEFAULT 'any_match',
  p_demographics_logic text DEFAULT 'any_match',
  p_has_uploaded_receipts boolean DEFAULT NULL,
  p_push_notifications_enabled boolean DEFAULT NULL,
  p_loyalty_engagement text DEFAULT NULL,
  p_member_status_logic text DEFAULT 'any_match',
  p_master_logic text DEFAULT 'any_section'
)
RETURNS TABLE(
  user_id uuid,
  total_spend numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT ga.user_id, ga.total_spend
  FROM public.get_advanced_member_analytics(
    p_date_start,
    p_date_end,
    p_min_age,
    p_max_age,
    NULLIF(p_interests, '{}'),
    p_interests_logic,
    NULLIF(p_venue_slugs, '{}'),
    p_venue_logic,
    p_min_spend,
    p_max_spend,
    NULLIF(p_tier_badges, '{}'),
    p_receipt_activity_period,
    p_visit_frequency,
    p_recent_activity,
    p_activity_logic,
    NULLIF(p_preferred_visit_days, '{}'),
    NULLIF(p_visit_timing, '{}'),
    p_avg_spend_per_visit,
    p_behavior_logic,
    p_demographics_logic,
    p_has_uploaded_receipts,
    p_push_notifications_enabled,
    p_loyalty_engagement,
    p_member_status_logic,
    p_master_logic
  ) AS ga;
$$;