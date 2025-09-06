-- Fix the advanced analytics function with proper type casting
CREATE OR REPLACE FUNCTION public.get_advanced_member_analytics(
  p_date_start DATE DEFAULT NULL,
  p_date_end DATE DEFAULT NULL,
  p_min_age INTEGER DEFAULT NULL,
  p_max_age INTEGER DEFAULT NULL,
  p_interests TEXT[] DEFAULT NULL,
  p_venue_slugs TEXT[] DEFAULT NULL,
  p_min_spend NUMERIC DEFAULT NULL,
  p_max_spend NUMERIC DEFAULT NULL,
  p_tier_badges TEXT[] DEFAULT NULL
)
RETURNS TABLE(
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  age INTEGER,
  interests TEXT[],
  tier_badge TEXT,
  total_transactions BIGINT,
  total_spend NUMERIC,
  avg_transaction NUMERIC,
  first_transaction_date DATE,
  last_transaction_date DATE,
  active_months BIGINT,
  active_days BIGINT,
  categories TEXT[],
  payment_methods TEXT[],
  currency TEXT,
  current_month_spend NUMERIC,
  current_week_spend NUMERIC,
  current_month_transactions BIGINT,
  favorite_venues TEXT[],
  visit_frequency NUMERIC,
  last_visit_date DATE,
  preferred_visit_times TEXT[],
  retention_risk_score NUMERIC,
  lifetime_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
        THEN EXTRACT(YEAR FROM AGE(p.birthday::DATE))::INTEGER
        ELSE NULL 
      END as age,
      p.interests,
      COALESCE(mp.tier_badge, 'bronze') as tier_badge
    FROM public.profiles p
    LEFT JOIN public.member_profiles_extended mp ON p.user_id = mp.user_id
    WHERE 1=1
      AND (p_min_age IS NULL OR (p.birthday IS NOT NULL AND EXTRACT(YEAR FROM AGE(p.birthday::DATE))::INTEGER >= p_min_age))
      AND (p_max_age IS NULL OR (p.birthday IS NOT NULL AND EXTRACT(YEAR FROM AGE(p.birthday::DATE))::INTEGER <= p_max_age))
      AND (p_interests IS NULL OR p.interests && p_interests)
      AND (p_tier_badges IS NULL OR COALESCE(mp.tier_badge, 'bronze') = ANY(p_tier_badges))
  ),
  member_analytics AS (
    SELECT 
      mb.user_id,
      mb.first_name,
      mb.last_name,
      mb.display_name,
      mb.age,
      mb.interests,
      mb.tier_badge,
      COUNT(ml.*) as total_transactions,
      COALESCE(SUM(CASE WHEN ml.amount > 0 THEN ml.amount ELSE 0 END), 0) as total_spend,
      AVG(CASE WHEN ml.amount > 0 THEN ml.amount ELSE NULL END) as avg_transaction,
      MIN(ml.activity_date) as first_transaction_date,
      MAX(ml.activity_date) as last_transaction_date,
      COUNT(DISTINCT DATE_TRUNC('month', ml.activity_date)) as active_months,
      COUNT(DISTINCT ml.activity_date) as active_days,
      ARRAY_AGG(DISTINCT ml.category) FILTER (WHERE ml.category IS NOT NULL) as categories,
      ARRAY_AGG(DISTINCT ml.payment_method) FILTER (WHERE ml.payment_method IS NOT NULL) as payment_methods,
      COALESCE(ml.currency, 'GBP') as currency,
      COALESCE(SUM(CASE WHEN ml.activity_date >= DATE_TRUNC('month', NOW()) THEN ml.amount ELSE 0 END), 0) as current_month_spend,
      COALESCE(SUM(CASE WHEN ml.activity_date >= DATE_TRUNC('week', NOW()) THEN ml.amount ELSE 0 END), 0) as current_week_spend,
      COUNT(CASE WHEN ml.activity_date >= DATE_TRUNC('month', NOW()) THEN 1 END) as current_month_transactions
    FROM member_base mb
    LEFT JOIN public.member_ledger ml ON mb.user_id = ml.user_id 
      AND (p_date_start IS NULL OR ml.activity_date >= p_date_start)
      AND (p_date_end IS NULL OR ml.activity_date <= p_date_end)
      AND ml.activity_type = 'receipt'
    GROUP BY mb.user_id, mb.first_name, mb.last_name, mb.display_name, mb.age, mb.interests, mb.tier_badge, ml.currency
  ),
  venue_analytics AS (
    SELECT 
      ma.user_id,
      ARRAY_AGG(DISTINCT mc.entrance_slug) FILTER (WHERE mc.entrance_slug IS NOT NULL) as favorite_venues,
      MAX(mc.check_in_date) as last_visit_date,
      CASE 
        WHEN COUNT(DISTINCT mc.check_in_date) > 0 AND MAX(mc.check_in_date) != MIN(mc.check_in_date)
        THEN COUNT(DISTINCT mc.check_in_date)::NUMERIC / GREATEST(EXTRACT(DAYS FROM (MAX(mc.check_in_date) - MIN(mc.check_in_date)))::NUMERIC / 7, 1)
        ELSE COALESCE(COUNT(DISTINCT mc.check_in_date)::NUMERIC, 0)
      END as visit_frequency,
      ARRAY_AGG(DISTINCT EXTRACT(HOUR FROM mc.check_in_timestamp)::TEXT) FILTER (WHERE mc.check_in_timestamp IS NOT NULL) as preferred_visit_times
    FROM member_analytics ma
    LEFT JOIN public.member_check_ins mc ON ma.user_id = mc.user_id
      AND (p_venue_slugs IS NULL OR mc.entrance_slug = ANY(p_venue_slugs))
    GROUP BY ma.user_id
  )
  SELECT 
    ma.user_id,
    ma.first_name,
    ma.last_name,
    ma.display_name,
    ma.age,
    ma.interests,
    ma.tier_badge,
    ma.total_transactions,
    ma.total_spend,
    ma.avg_transaction,
    ma.first_transaction_date,
    ma.last_transaction_date,
    ma.active_months,
    ma.active_days,
    ma.categories,
    ma.payment_methods,
    ma.currency,
    ma.current_month_spend,
    ma.current_week_spend,
    ma.current_month_transactions,
    COALESCE(va.favorite_venues, ARRAY[]::TEXT[]) as favorite_venues,
    COALESCE(va.visit_frequency, 0) as visit_frequency,
    va.last_visit_date,
    COALESCE(va.preferred_visit_times, ARRAY[]::TEXT[]) as preferred_visit_times,
    -- Retention risk score (0-100, higher = more at risk)
    CASE 
      WHEN va.last_visit_date IS NULL THEN 95
      WHEN va.last_visit_date < NOW() - INTERVAL '30 days' THEN 90
      WHEN va.last_visit_date < NOW() - INTERVAL '14 days' THEN 70
      WHEN va.last_visit_date < NOW() - INTERVAL '7 days' THEN 40
      WHEN va.visit_frequency < 0.5 THEN 60
      ELSE 20
    END as retention_risk_score,
    -- Lifetime value estimate
    CASE 
      WHEN ma.active_months > 0 
      THEN (ma.total_spend / GREATEST(ma.active_months, 1)) * 12
      ELSE ma.total_spend 
    END as lifetime_value
  FROM member_analytics ma
  LEFT JOIN venue_analytics va ON ma.user_id = va.user_id
  WHERE 1=1
    AND (p_min_spend IS NULL OR ma.total_spend >= p_min_spend)
    AND (p_max_spend IS NULL OR ma.total_spend <= p_max_spend)
  ORDER BY ma.total_spend DESC;
END;
$$;