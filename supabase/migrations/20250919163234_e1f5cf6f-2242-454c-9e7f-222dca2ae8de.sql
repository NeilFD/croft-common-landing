-- Fix the get_advanced_member_analytics function to handle no filters case
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
  currencies text[],
  current_month_spend numeric,
  current_week_spend numeric,
  current_month_transactions bigint,
  visit_frequency integer,
  last_visit_date date,
  favorite_venues text[],
  preferred_visit_times text[],
  retention_risk_score integer,
  lifetime_value numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Sanitize array inputs - convert empty arrays to NULL
  IF p_interests IS NOT NULL AND array_length(p_interests, 1) IS NULL THEN
    p_interests := NULL;
  END IF;
  
  IF p_venue_slugs IS NOT NULL AND array_length(p_venue_slugs, 1) IS NULL THEN
    p_venue_slugs := NULL;
  END IF;
  
  IF p_tier_badges IS NOT NULL AND array_length(p_tier_badges, 1) IS NULL THEN
    p_tier_badges := NULL;
  END IF;
  
  IF p_preferred_visit_days IS NOT NULL AND array_length(p_preferred_visit_days, 1) IS NULL THEN
    p_preferred_visit_days := NULL;
  END IF;
  
  IF p_visit_timing IS NOT NULL AND array_length(p_visit_timing, 1) IS NULL THEN
    p_visit_timing := NULL;
  END IF;

  RETURN QUERY
  WITH authenticated_members_with_receipts AS (
    SELECT DISTINCT mr.user_id
    FROM public.member_receipts mr
    INNER JOIN auth.users au ON au.id = mr.user_id
    WHERE (p_date_start IS NULL OR mr.receipt_date >= p_date_start)
      AND (p_date_end IS NULL OR mr.receipt_date <= p_date_end)
  ),
  base_data AS (
    SELECT 
      p.user_id,
      p.first_name,
      p.last_name,
      COALESCE(mp.display_name, CONCAT(p.first_name, ' ', p.last_name)) as display_name,
      CASE WHEN p.birthday IS NOT NULL THEN EXTRACT(YEAR FROM AGE(p.birthday))::INTEGER ELSE 0 END as age,
      p.interests,
      COALESCE(mp.tier_badge, 'bronze') as tier_badge,
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
    FROM authenticated_members_with_receipts amwr
    INNER JOIN public.profiles p ON p.user_id = amwr.user_id
    LEFT JOIN public.member_profiles_extended mp ON p.user_id = mp.user_id
    LEFT JOIN public.member_receipts mr ON p.user_id = mr.user_id
      AND (p_date_start IS NULL OR mr.receipt_date >= p_date_start)
      AND (p_date_end IS NULL OR mr.receipt_date <= p_date_end)
    WHERE 1=1
    GROUP BY 
      p.user_id, p.first_name, p.last_name, mp.display_name, p.birthday, 
      p.interests, mp.tier_badge
    HAVING COUNT(mr.id) > 0
  ),
  enhanced_data AS (
    SELECT 
      bd.*,
      COALESCE((
        SELECT COUNT(*)::INTEGER FROM public.member_check_ins mci 
        WHERE mci.user_id = bd.user_id
      ), 0) as visit_frequency,
      (
        SELECT MAX(mci.check_in_date) FROM public.member_check_ins mci 
        WHERE mci.user_id = bd.user_id
      ) as last_visit_date,
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
      ARRAY['12', '15', '17', '22'] as preferred_visit_times,
      CASE 
        WHEN bd.last_transaction_date IS NULL THEN 10
        WHEN bd.last_transaction_date < CURRENT_DATE - INTERVAL '30 days' THEN 80
        WHEN bd.last_transaction_date < CURRENT_DATE - INTERVAL '14 days' THEN 40
        ELSE 20
      END as retention_risk_score,
      CASE 
        WHEN bd.active_months > 0 THEN 
          ROUND((bd.total_spend * 12.0 / bd.active_months), 2)
        ELSE 0
      END as lifetime_value
    FROM base_data bd
  ),
  filtered_data AS (
    SELECT ed.*
    FROM enhanced_data ed
    WHERE 
      -- If no filters are provided, return all members
      (
        p_min_age IS NULL AND p_max_age IS NULL AND
        p_interests IS NULL AND p_venue_slugs IS NULL AND
        p_min_spend IS NULL AND p_max_spend IS NULL AND
        p_tier_badges IS NULL AND p_receipt_activity_period IS NULL AND
        p_visit_frequency IS NULL AND p_recent_activity IS NULL AND
        p_preferred_visit_days IS NULL AND p_visit_timing IS NULL AND
        p_avg_spend_per_visit IS NULL AND p_has_uploaded_receipts IS NULL AND
        p_push_notifications_enabled IS NULL AND p_loyalty_engagement IS NULL
      )
      OR
      -- Apply filters if any are provided
      (
        -- Age filters
        (p_min_age IS NULL OR ed.age >= p_min_age) AND
        (p_max_age IS NULL OR ed.age <= p_max_age) AND
        
        -- Interests filter
        (p_interests IS NULL OR 
         (p_interests_logic = 'match_any' AND ed.interests && p_interests) OR
         (p_interests_logic = 'match_all' AND ed.interests @> p_interests)) AND
        
        -- Spend filters
        (p_min_spend IS NULL OR ed.total_spend >= p_min_spend) AND
        (p_max_spend IS NULL OR ed.total_spend <= p_max_spend) AND
        
        -- Tier badge filter
        (p_tier_badges IS NULL OR ed.tier_badge = ANY(p_tier_badges)) AND
        
        -- Activity filters
        (p_receipt_activity_period IS NULL OR 
         CASE p_receipt_activity_period 
           WHEN 'last_30_days' THEN ed.last_transaction_date >= CURRENT_DATE - INTERVAL '30 days'
           WHEN 'last_60_days' THEN ed.last_transaction_date >= CURRENT_DATE - INTERVAL '60 days'
           WHEN 'last_90_days' THEN ed.last_transaction_date >= CURRENT_DATE - INTERVAL '90 days'
           ELSE true
         END) AND
        
        -- Visit frequency filter
        (p_visit_frequency IS NULL OR 
         CASE p_visit_frequency
           WHEN 'high' THEN ed.visit_frequency >= 10
           WHEN 'medium' THEN ed.visit_frequency BETWEEN 3 AND 9
           WHEN 'low' THEN ed.visit_frequency BETWEEN 1 AND 2
           ELSE true
         END) AND
        
        -- Recent activity filter
        (p_recent_activity IS NULL OR 
         CASE p_recent_activity
           WHEN 'active' THEN ed.last_transaction_date >= CURRENT_DATE - INTERVAL '7 days'
           WHEN 'inactive' THEN ed.last_transaction_date < CURRENT_DATE - INTERVAL '14 days'
           ELSE true
         END) AND
        
        -- Receipt upload filter
        (p_has_uploaded_receipts IS NULL OR 
         (p_has_uploaded_receipts = true AND ed.total_transactions > 0) OR
         (p_has_uploaded_receipts = false AND ed.total_transactions = 0))
      )
  )
  SELECT 
    fd.user_id,
    fd.first_name,
    fd.last_name,
    fd.display_name,
    fd.age,
    fd.interests,
    fd.tier_badge,
    fd.total_transactions,
    fd.total_spend,
    fd.avg_transaction,
    fd.first_transaction_date,
    fd.last_transaction_date,
    fd.active_months,
    fd.active_days,
    fd.currencies,
    fd.current_month_spend,
    fd.current_week_spend,
    fd.current_month_transactions,
    fd.visit_frequency,
    fd.last_visit_date,
    fd.favorite_venues,
    fd.preferred_visit_times,
    fd.retention_risk_score,
    fd.lifetime_value
  FROM filtered_data fd
  ORDER BY fd.total_spend DESC;
END;
$function$;