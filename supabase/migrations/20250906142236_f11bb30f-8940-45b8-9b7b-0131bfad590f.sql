-- Update the advanced member analytics function to only show real active members
-- This will filter out test/fake users and only show members with actual activity

CREATE OR REPLACE FUNCTION public.get_advanced_member_analytics(
  p_date_start date DEFAULT NULL::date, 
  p_date_end date DEFAULT NULL::date, 
  p_min_age integer DEFAULT NULL::integer, 
  p_max_age integer DEFAULT NULL::integer, 
  p_interests text[] DEFAULT NULL::text[], 
  p_venue_slugs text[] DEFAULT NULL::text[], 
  p_min_spend numeric DEFAULT NULL::numeric, 
  p_max_spend numeric DEFAULT NULL::numeric, 
  p_tier_badges text[] DEFAULT NULL::text[]
)
RETURNS TABLE(
  user_id uuid, 
  first_name text, 
  last_name text, 
  display_name text, 
  age integer, 
  interests text[], 
  tier_badge text, 
  total_transactions bigint, 
  total_spend numeric, 
  avg_transaction numeric, 
  first_transaction_date date, 
  last_transaction_date date, 
  active_months bigint, 
  active_days bigint, 
  categories text[], 
  payment_methods text[], 
  currency text, 
  current_month_spend numeric, 
  current_week_spend numeric, 
  current_month_transactions bigint, 
  favorite_venues text[], 
  visit_frequency numeric, 
  last_visit_date date, 
  preferred_visit_times text[], 
  retention_risk_score numeric, 
  lifetime_value numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH member_base AS (
    SELECT 
      p.user_id,
      p.first_name,
      p.last_name,
      mp.display_name,
      CASE 
        WHEN p.birthday IS NOT NULL 
        THEN EXTRACT(YEAR FROM age(p.birthday))::INTEGER
        ELSE NULL 
      END as age,
      p.interests,
      COALESCE(mp.tier_badge, 'bronze') as tier_badge
    FROM public.profiles p
    LEFT JOIN public.member_profiles_extended mp ON p.user_id = mp.user_id
    WHERE 1=1
      AND (p_min_age IS NULL OR (p.birthday IS NOT NULL AND EXTRACT(YEAR FROM age(p.birthday))::INTEGER >= p_min_age))
      AND (p_max_age IS NULL OR (p.birthday IS NOT NULL AND EXTRACT(YEAR FROM age(p.birthday))::INTEGER <= p_max_age))
      AND (p_interests IS NULL OR p.interests && p_interests)
      AND (p_tier_badges IS NULL OR COALESCE(mp.tier_badge, 'bronze') = ANY(p_tier_badges))
      -- Only include users who have actual activity (transactions or check-ins)
      AND (
        EXISTS (SELECT 1 FROM public.member_ledger ml WHERE ml.user_id = p.user_id AND ml.activity_type = 'receipt')
        OR EXISTS (SELECT 1 FROM public.member_check_ins mc WHERE mc.user_id = p.user_id)
      )
  ),
  transaction_data AS (
    SELECT 
      mb.user_id,
      mb.first_name,
      mb.last_name,
      mb.display_name,
      mb.age,
      mb.interests,
      mb.tier_badge,
      COALESCE(ml.currency, 'GBP') as currency,
      COUNT(ml.id) as total_transactions,
      COALESCE(SUM(CASE WHEN ml.amount > 0 THEN ml.amount ELSE 0 END), 0) as total_spend,
      AVG(CASE WHEN ml.amount > 0 THEN ml.amount ELSE NULL END) as avg_transaction,
      MIN(ml.activity_date) as first_transaction_date,
      MAX(ml.activity_date) as last_transaction_date,
      COUNT(DISTINCT DATE_TRUNC('month', ml.activity_date)) as active_months,
      COUNT(DISTINCT ml.activity_date) as active_days,
      ARRAY_AGG(DISTINCT ml.category) FILTER (WHERE ml.category IS NOT NULL) as categories,
      ARRAY_AGG(DISTINCT ml.payment_method) FILTER (WHERE ml.payment_method IS NOT NULL) as payment_methods,
      SUM(CASE WHEN ml.activity_date >= DATE_TRUNC('month', NOW()) THEN COALESCE(ml.amount, 0) ELSE 0 END) as current_month_spend,
      SUM(CASE WHEN ml.activity_date >= DATE_TRUNC('week', NOW()) THEN COALESCE(ml.amount, 0) ELSE 0 END) as current_week_spend,
      COUNT(CASE WHEN ml.activity_date >= DATE_TRUNC('month', NOW()) THEN 1 END) as current_month_transactions
    FROM member_base mb
    LEFT JOIN public.member_ledger ml ON mb.user_id = ml.user_id 
      AND (p_date_start IS NULL OR ml.activity_date >= p_date_start)
      AND (p_date_end IS NULL OR ml.activity_date <= p_date_end)
      AND ml.activity_type = 'receipt'
    GROUP BY mb.user_id, mb.first_name, mb.last_name, mb.display_name, mb.age, mb.interests, mb.tier_badge, ml.currency
  ),
  venue_data AS (
    SELECT 
      td.user_id,
      ARRAY_AGG(DISTINCT mc.entrance_slug) FILTER (WHERE mc.entrance_slug IS NOT NULL) as favorite_venues,
      MAX(mc.check_in_date) as last_visit_date,
      CASE 
        WHEN COUNT(DISTINCT mc.check_in_date) > 0 AND MAX(mc.check_in_date) != MIN(mc.check_in_date)
        THEN COUNT(DISTINCT mc.check_in_date)::NUMERIC / GREATEST((MAX(mc.check_in_date) - MIN(mc.check_in_date))::INTEGER / 7.0, 1)
        ELSE COALESCE(COUNT(DISTINCT mc.check_in_date), 0)::NUMERIC
      END as visit_frequency,
      ARRAY_AGG(DISTINCT EXTRACT(HOUR FROM mc.check_in_timestamp)::TEXT) FILTER (WHERE mc.check_in_timestamp IS NOT NULL) as preferred_visit_times
    FROM transaction_data td
    LEFT JOIN public.member_check_ins mc ON td.user_id = mc.user_id
      AND (p_venue_slugs IS NULL OR mc.entrance_slug = ANY(p_venue_slugs))
    GROUP BY td.user_id
  )
  SELECT 
    td.user_id,
    td.first_name,
    td.last_name,
    td.display_name,
    td.age,
    td.interests,
    td.tier_badge,
    td.total_transactions::bigint,
    td.total_spend::numeric,
    COALESCE(td.avg_transaction, 0)::numeric,
    td.first_transaction_date,
    td.last_transaction_date,
    td.active_months::bigint,
    td.active_days::bigint,
    td.categories,
    td.payment_methods,
    td.currency,
    td.current_month_spend::numeric,
    td.current_week_spend::numeric,
    td.current_month_transactions::bigint,
    COALESCE(vd.favorite_venues, ARRAY[]::TEXT[]) as favorite_venues,
    COALESCE(vd.visit_frequency, 0)::numeric as visit_frequency,
    vd.last_visit_date,
    COALESCE(vd.preferred_visit_times, ARRAY[]::TEXT[]) as preferred_visit_times,
    -- Retention risk score (0-100, higher = more at risk)
    (CASE 
      WHEN vd.last_visit_date IS NULL THEN 95
      WHEN vd.last_visit_date < NOW() - INTERVAL '30 days' THEN 90
      WHEN vd.last_visit_date < NOW() - INTERVAL '14 days' THEN 70
      WHEN vd.last_visit_date < NOW() - INTERVAL '7 days' THEN 40
      WHEN vd.visit_frequency < 0.5 THEN 60
      ELSE 20
    END)::numeric as retention_risk_score,
    -- Lifetime value estimate
    (CASE 
      WHEN td.active_months > 0 
      THEN (td.total_spend / GREATEST(td.active_months, 1)) * 12
      ELSE td.total_spend 
    END)::numeric as lifetime_value
  FROM transaction_data td
  LEFT JOIN venue_data vd ON td.user_id = vd.user_id
  WHERE 1=1
    AND (p_min_spend IS NULL OR td.total_spend >= p_min_spend)
    AND (p_max_spend IS NULL OR td.total_spend <= p_max_spend)
    -- Additional filter to ensure we only show users with meaningful activity
    AND (td.total_transactions > 0 OR vd.last_visit_date IS NOT NULL)
  ORDER BY td.total_spend DESC;
END;
$function$;