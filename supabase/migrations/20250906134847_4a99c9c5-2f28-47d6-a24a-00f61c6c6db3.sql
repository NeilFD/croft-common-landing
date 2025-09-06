-- Create advanced analytics functions and enhanced member analytics view

-- Enhanced member analytics function with demographic and behavioral filters
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
        THEN EXTRACT(YEAR FROM AGE(p.birthday))::INTEGER
        ELSE NULL 
      END as age,
      p.interests,
      COALESCE(mp.tier_badge, 'bronze') as tier_badge
    FROM public.profiles p
    LEFT JOIN public.member_profiles_extended mp ON p.user_id = mp.user_id
    WHERE 1=1
      AND (p_min_age IS NULL OR EXTRACT(YEAR FROM AGE(p.birthday))::INTEGER >= p_min_age)
      AND (p_max_age IS NULL OR EXTRACT(YEAR FROM AGE(p.birthday))::INTEGER <= p_max_age)
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
    FROM member_base mb
    LEFT JOIN public.member_ledger ml ON mb.user_id = ml.user_id
    WHERE 1=1
      AND (p_date_start IS NULL OR ml.activity_date >= p_date_start)
      AND (p_date_end IS NULL OR ml.activity_date <= p_date_end)
    GROUP BY mb.user_id, mb.first_name, mb.last_name, mb.display_name, mb.age, mb.interests, mb.tier_badge, ml.currency
  ),
  venue_analytics AS (
    SELECT 
      ma.user_id,
      ARRAY_AGG(DISTINCT mc.entrance_slug) FILTER (WHERE mc.entrance_slug IS NOT NULL) as favorite_venues,
      MAX(mc.check_in_date) as last_visit_date,
      CASE 
        WHEN COUNT(DISTINCT mc.check_in_date) > 0 
        THEN COUNT(DISTINCT mc.check_in_date)::NUMERIC / GREATEST(EXTRACT(DAYS FROM (MAX(mc.check_in_date) - MIN(mc.check_in_date)))::NUMERIC / 7, 1)
        ELSE 0 
      END as visit_frequency,
      ARRAY_AGG(DISTINCT EXTRACT(HOUR FROM mc.check_in_timestamp)::TEXT) FILTER (WHERE mc.check_in_timestamp IS NOT NULL) as preferred_visit_times
    FROM member_analytics ma
    LEFT JOIN public.member_check_ins mc ON ma.user_id = mc.user_id
    WHERE 1=1
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
    va.favorite_venues,
    COALESCE(va.visit_frequency, 0) as visit_frequency,
    va.last_visit_date,
    va.preferred_visit_times,
    -- Retention risk score (0-100, higher = more at risk)
    CASE 
      WHEN va.last_visit_date < NOW() - INTERVAL '30 days' THEN 90
      WHEN va.last_visit_date < NOW() - INTERVAL '14 days' THEN 70
      WHEN va.last_visit_date < NOW() - INTERVAL '7 days' THEN 40
      WHEN va.visit_frequency < 0.5 THEN 60
      ELSE 20
    END as retention_risk_score,
    -- Lifetime value estimate
    CASE 
      WHEN ma.active_months > 0 
      THEN (ma.total_spend / ma.active_months) * 12
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

-- Function to get individual member deep-dive data
CREATE OR REPLACE FUNCTION public.get_member_deep_dive(p_user_id UUID)
RETURNS TABLE(
  user_id UUID,
  profile_data JSONB,
  spend_breakdown JSONB,
  visit_patterns JSONB,
  engagement_metrics JSONB,
  recent_activity JSONB[],
  predictive_insights JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  member_record RECORD;
  spend_data JSONB;
  visit_data JSONB;
  engagement_data JSONB;
  activity_data JSONB[];
  insights_data JSONB;
BEGIN
  -- Get basic profile data
  SELECT 
    p.user_id,
    jsonb_build_object(
      'first_name', p.first_name,
      'last_name', p.last_name,
      'display_name', mp.display_name,
      'age', CASE WHEN p.birthday IS NOT NULL THEN EXTRACT(YEAR FROM AGE(p.birthday))::INTEGER ELSE NULL END,
      'interests', p.interests,
      'tier_badge', COALESCE(mp.tier_badge, 'bronze'),
      'member_since', mp.join_date,
      'avatar_url', mp.avatar_url,
      'favorite_venue', mp.favorite_venue,
      'favorite_drink', mp.favorite_drink
    ) as profile_data
  INTO member_record
  FROM public.profiles p
  LEFT JOIN public.member_profiles_extended mp ON p.user_id = mp.user_id
  WHERE p.user_id = p_user_id;

  IF member_record IS NULL THEN
    RETURN;
  END IF;

  -- Get spend breakdown
  SELECT jsonb_build_object(
    'total_spend', COALESCE(SUM(amount), 0),
    'avg_transaction', COALESCE(AVG(amount), 0),
    'transaction_count', COUNT(*),
    'by_category', jsonb_object_agg(
      COALESCE(category, 'uncategorized'), 
      jsonb_build_object(
        'total', SUM(amount),
        'count', COUNT(*)
      )
    ),
    'monthly_trend', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'month', DATE_TRUNC('month', activity_date),
          'spend', SUM(amount),
          'transactions', COUNT(*)
        )
      )
      FROM public.member_ledger 
      WHERE user_id = p_user_id 
        AND activity_type = 'receipt' 
        AND activity_date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', activity_date)
      ORDER BY DATE_TRUNC('month', activity_date)
    )
  ) INTO spend_data
  FROM public.member_ledger
  WHERE user_id = p_user_id AND activity_type = 'receipt' AND amount IS NOT NULL;

  -- Get visit patterns
  SELECT jsonb_build_object(
    'total_visits', COUNT(*),
    'current_streak', COALESCE(ms.current_streak, 0),
    'longest_streak', COALESCE(ms.longest_streak, 0),
    'favorite_entrances', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'entrance', entrance_slug,
          'visit_count', COUNT(*)
        )
      )
      FROM public.member_check_ins 
      WHERE user_id = p_user_id
      GROUP BY entrance_slug
      ORDER BY COUNT(*) DESC
      LIMIT 5
    ),
    'visit_times', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'hour', EXTRACT(HOUR FROM check_in_timestamp),
          'count', COUNT(*)
        )
      )
      FROM public.member_check_ins 
      WHERE user_id = p_user_id
      GROUP BY EXTRACT(HOUR FROM check_in_timestamp)
      ORDER BY COUNT(*) DESC
    ),
    'weekly_pattern', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'day_of_week', EXTRACT(DOW FROM check_in_date),
          'count', COUNT(*)
        )
      )
      FROM public.member_check_ins 
      WHERE user_id = p_user_id
      GROUP BY EXTRACT(DOW FROM check_in_date)
      ORDER BY EXTRACT(DOW FROM check_in_date)
    )
  ) INTO visit_data
  FROM public.member_check_ins mc
  LEFT JOIN public.member_streaks ms ON mc.user_id = ms.user_id
  WHERE mc.user_id = p_user_id;

  -- Get engagement metrics
  SELECT jsonb_build_object(
    'push_subscriptions', (
      SELECT COUNT(*) FROM public.push_subscriptions 
      WHERE user_id = p_user_id AND is_active = true
    ),
    'moments_shared', (
      SELECT COUNT(*) FROM public.member_moments 
      WHERE user_id = p_user_id
    ),
    'last_activity_date', (
      SELECT MAX(activity_date) FROM public.member_ledger 
      WHERE user_id = p_user_id
    )
  ) INTO engagement_data;

  -- Get recent activity
  SELECT ARRAY_AGG(
    jsonb_build_object(
      'date', activity_date,
      'type', activity_type,
      'description', description,
      'amount', amount,
      'metadata', metadata
    )
  ) INTO activity_data
  FROM public.member_ledger
  WHERE user_id = p_user_id
  ORDER BY activity_timestamp DESC
  LIMIT 20;

  -- Generate predictive insights
  SELECT jsonb_build_object(
    'churn_risk', 
    CASE 
      WHEN visit_data->>'total_visits' = '0' THEN 'high'
      WHEN (spend_data->>'total_spend')::NUMERIC = 0 THEN 'high'
      WHEN (engagement_data->>'last_activity_date')::DATE < NOW() - INTERVAL '30 days' THEN 'medium'
      ELSE 'low'
    END,
    'predicted_monthly_spend', 
    CASE 
      WHEN (spend_data->'monthly_trend') IS NOT NULL 
      THEN (SELECT AVG((value->>'spend')::NUMERIC) FROM jsonb_array_elements(spend_data->'monthly_trend'))
      ELSE 0
    END,
    'recommendations', ARRAY[
      CASE 
        WHEN (spend_data->>'total_spend')::NUMERIC > 100 THEN 'VIP program candidate'
        WHEN (visit_data->>'total_visits')::INTEGER > 20 THEN 'Loyalty program candidate'
        ELSE 'Engagement needed'
      END
    ]
  ) INTO insights_data;

  RETURN QUERY SELECT 
    member_record.user_id,
    member_record.profile_data,
    spend_data,
    visit_data,
    engagement_data,
    activity_data,
    insights_data;
END;
$$;

-- Function to get member segments for campaign targeting
CREATE OR REPLACE FUNCTION public.get_member_segments()
RETURNS TABLE(
  segment_name TEXT,
  segment_description TEXT,
  member_count BIGINT,
  avg_spend NUMERIC,
  criteria JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH segment_data AS (
    SELECT 
      'High Value Regulars' as segment_name,
      'Members with high spend and frequent visits' as segment_description,
      COUNT(*) as member_count,
      AVG(total_spend) as avg_spend,
      jsonb_build_object(
        'min_spend', 200,
        'min_visits', 10,
        'criteria', 'total_spend >= 200 AND total_visits >= 10'
      ) as criteria
    FROM (
      SELECT 
        ml.user_id,
        SUM(CASE WHEN ml.amount > 0 THEN ml.amount ELSE 0 END) as total_spend,
        COUNT(DISTINCT mc.check_in_date) as total_visits
      FROM public.member_ledger ml
      LEFT JOIN public.member_check_ins mc ON ml.user_id = mc.user_id
      WHERE ml.activity_type = 'receipt'
      GROUP BY ml.user_id
      HAVING SUM(CASE WHEN ml.amount > 0 THEN ml.amount ELSE 0 END) >= 200
        AND COUNT(DISTINCT mc.check_in_date) >= 10
    ) hvr
    
    UNION ALL
    
    SELECT 
      'New Members' as segment_name,
      'Members who joined in the last 30 days' as segment_description,
      COUNT(*) as member_count,
      AVG(COALESCE(total_spend, 0)) as avg_spend,
      jsonb_build_object(
        'join_days', 30,
        'criteria', 'joined within last 30 days'
      ) as criteria
    FROM public.member_profiles_extended mp
    LEFT JOIN (
      SELECT 
        user_id,
        SUM(amount) as total_spend
      FROM public.member_ledger 
      WHERE activity_type = 'receipt'
      GROUP BY user_id
    ) spend ON mp.user_id = spend.user_id
    WHERE mp.join_date >= NOW() - INTERVAL '30 days'
    
    UNION ALL
    
    SELECT 
      'At Risk Members' as segment_name,
      'Members with declining activity' as segment_description,
      COUNT(*) as member_count,
      AVG(COALESCE(total_spend, 0)) as avg_spend,
      jsonb_build_object(
        'last_activity_days', 14,
        'criteria', 'no activity in last 14 days'
      ) as criteria
    FROM public.profiles p
    LEFT JOIN (
      SELECT 
        user_id,
        MAX(activity_date) as last_activity,
        SUM(amount) as total_spend
      FROM public.member_ledger 
      GROUP BY user_id
    ) activity ON p.user_id = activity.user_id
    WHERE activity.last_activity < NOW() - INTERVAL '14 days'
      OR activity.last_activity IS NULL
  )
  SELECT * FROM segment_data;
END;
$$;