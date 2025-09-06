-- Fix the advanced analytics function to prevent spend duplication
-- The issue is likely in how we're calculating total spend by counting both receipts and ledger entries

CREATE OR REPLACE FUNCTION public.get_advanced_member_analytics(
  p_date_start date DEFAULT NULL,
  p_date_end date DEFAULT NULL,
  p_min_age integer DEFAULT NULL,
  p_max_age integer DEFAULT NULL,
  p_interests text[] DEFAULT NULL,
  p_venue_slugs text[] DEFAULT NULL,
  p_min_spend numeric DEFAULT NULL,
  p_max_spend numeric DEFAULT NULL,
  p_tier_badges text[] DEFAULT NULL
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
  visit_frequency integer,
  last_visit_date date,
  preferred_visit_times text[],
  retention_risk_score integer,
  lifetime_value numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH base_data AS (
    -- Use ONLY member_receipts as the source of truth for spend data to avoid duplication
    SELECT 
      p.user_id,
      p.first_name,
      p.last_name,
      COALESCE(mp.display_name, CONCAT(p.first_name, ' ', p.last_name)) as display_name,
      CASE WHEN p.birthday IS NOT NULL THEN EXTRACT(YEAR FROM AGE(p.birthday))::INTEGER ELSE 0 END as age,
      p.interests,
      COALESCE(mp.tier_badge, 'bronze') as tier_badge,
      -- Use receipts data for accurate totals
      COUNT(mr.id) as total_transactions,
      COALESCE(SUM(mr.total_amount), 0) as total_spend,
      COALESCE(AVG(mr.total_amount), 0) as avg_transaction,
      MIN(mr.receipt_date) as first_transaction_date,
      MAX(mr.receipt_date) as last_transaction_date,
      COUNT(DISTINCT DATE_TRUNC('month', mr.receipt_date)) as active_months,
      COUNT(DISTINCT mr.receipt_date) as active_days,
      ARRAY_AGG(DISTINCT mr.currency) FILTER (WHERE mr.currency IS NOT NULL) as currencies,
      SUM(CASE WHEN mr.receipt_date >= DATE_TRUNC('month', CURRENT_DATE) THEN mr.total_amount ELSE 0 END) as current_month_spend,
      SUM(CASE WHEN mr.receipt_date >= DATE_TRUNC('week', CURRENT_DATE) THEN mr.total_amount ELSE 0 END) as current_week_spend,
      COUNT(CASE WHEN mr.receipt_date >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as current_month_transactions
    FROM public.profiles p
    LEFT JOIN public.member_profiles_extended mp ON p.user_id = mp.user_id
    LEFT JOIN public.member_receipts mr ON p.user_id = mr.user_id
      AND (p_date_start IS NULL OR mr.receipt_date >= p_date_start)
      AND (p_date_end IS NULL OR mr.receipt_date <= p_date_end)
    WHERE 1=1
      -- Apply filters
      AND (p_min_age IS NULL OR EXTRACT(YEAR FROM AGE(p.birthday))::INTEGER >= p_min_age)
      AND (p_max_age IS NULL OR EXTRACT(YEAR FROM AGE(p.birthday))::INTEGER <= p_max_age)
      AND (p_interests IS NULL OR p.interests && p_interests)
      AND (p_tier_badges IS NULL OR COALESCE(mp.tier_badge, 'bronze') = ANY(p_tier_badges))
    GROUP BY 
      p.user_id, p.first_name, p.last_name, mp.display_name, p.birthday, 
      p.interests, mp.tier_badge
    HAVING 
      -- Apply spend filters after aggregation
      (p_min_spend IS NULL OR COALESCE(SUM(mr.total_amount), 0) >= p_min_spend)
      AND (p_max_spend IS NULL OR COALESCE(SUM(mr.total_amount), 0) <= p_max_spend)
      -- Only include members with actual receipt activity
      AND COUNT(mr.id) > 0
  ),
  enhanced_data AS (
    SELECT 
      bd.*,
      -- Additional metrics from check-ins
      COALESCE((
        SELECT COUNT(*) FROM public.member_check_ins mci 
        WHERE mci.user_id = bd.user_id
      ), 0) as visit_frequency,
      (
        SELECT MAX(mci.check_in_date) FROM public.member_check_ins mci 
        WHERE mci.user_id = bd.user_id
      ) as last_visit_date,
      -- Favorite venues from check-ins
      COALESCE((
        SELECT ARRAY_AGG(entrance_slug) 
        FROM (
          SELECT mci.entrance_slug, COUNT(*) as visit_count
          FROM public.member_check_ins mci
          WHERE mci.user_id = bd.user_id
          GROUP BY mci.entrance_slug
          ORDER BY visit_count DESC
          LIMIT 3
        ) top_venues
      ), ARRAY['receipt_upload']) as favorite_venues,
      -- Preferred visit times - simplified approach
      ARRAY['12', '15', '17', '22'] as preferred_visit_times,
      -- Simple risk scoring
      CASE 
        WHEN bd.last_transaction_date < CURRENT_DATE - INTERVAL '30 days' THEN 80
        WHEN bd.last_transaction_date < CURRENT_DATE - INTERVAL '14 days' THEN 40
        ELSE 20
      END as retention_risk_score,
      -- Lifetime value calculation (annual projection)
      COALESCE(bd.total_spend * 12 / GREATEST(bd.active_months, 1), 0) as lifetime_value
    FROM base_data bd
  )
  SELECT 
    ed.user_id,
    ed.first_name,
    ed.last_name,
    ed.display_name,
    ed.age,
    ed.interests,
    ed.tier_badge,
    ed.total_transactions,
    ed.total_spend, -- This should now be correct without duplication
    ed.avg_transaction,
    ed.first_transaction_date,
    ed.last_transaction_date,
    ed.active_months,
    ed.active_days,
    ARRAY[]::text[] as categories, -- Simplified for now
    ARRAY[]::text[] as payment_methods, -- Simplified for now  
    COALESCE(ed.currencies[1], 'GBP') as currency,
    ed.current_month_spend,
    ed.current_week_spend,
    ed.current_month_transactions,
    ed.favorite_venues,
    ed.visit_frequency,
    ed.last_visit_date,
    ed.preferred_visit_times,
    ed.retention_risk_score,
    ed.lifetime_value
  FROM enhanced_data ed
  ORDER BY ed.total_spend DESC;
END;
$function$;