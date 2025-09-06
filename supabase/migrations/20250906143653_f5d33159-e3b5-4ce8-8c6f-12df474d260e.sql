-- Fix remaining nested aggregates in get_member_deep_dive function
CREATE OR REPLACE FUNCTION public.get_member_deep_dive(p_user_id uuid)
 RETURNS TABLE(user_id uuid, profile_data jsonb, spend_breakdown jsonb, visit_patterns jsonb, engagement_metrics jsonb, recent_activity jsonb[], predictive_insights jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  member_record RECORD;
  spend_data JSONB;
  visit_data JSONB;
  engagement_data JSONB;
  activity_data JSONB[];
  insights_data JSONB;
  monthly_trend_data JSONB;
  category_breakdown JSONB;
  entrance_data JSONB;
  visit_times_data JSONB;
  weekly_pattern_data JSONB;
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

  -- Get monthly trend data separately to avoid nested aggregates
  SELECT jsonb_agg(
    jsonb_build_object(
      'month', month_start,
      'spend', monthly_spend,
      'transactions', monthly_count
    )
  ) INTO monthly_trend_data
  FROM (
    SELECT 
      DATE_TRUNC('month', ml.activity_date) as month_start,
      SUM(ml.amount) as monthly_spend,
      COUNT(*) as monthly_count
    FROM public.member_ledger ml
    WHERE ml.user_id = p_user_id 
      AND ml.activity_type = 'receipt' 
      AND ml.activity_date >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', ml.activity_date)
    ORDER BY DATE_TRUNC('month', ml.activity_date)
  ) monthly_data;

  -- Get category breakdown separately
  SELECT jsonb_object_agg(
    COALESCE(category, 'uncategorized'), 
    jsonb_build_object(
      'total', total_amount,
      'count', transaction_count
    )
  ) INTO category_breakdown
  FROM (
    SELECT 
      ml.category,
      SUM(ml.amount) as total_amount,
      COUNT(*) as transaction_count
    FROM public.member_ledger ml
    WHERE ml.user_id = p_user_id AND ml.activity_type = 'receipt' AND ml.amount IS NOT NULL
    GROUP BY ml.category
  ) cat_data;

  -- Get spend breakdown
  SELECT jsonb_build_object(
    'total_spend', COALESCE(SUM(ml.amount), 0),
    'avg_transaction', COALESCE(AVG(ml.amount), 0),
    'transaction_count', COUNT(*),
    'by_category', COALESCE(category_breakdown, '{}'::jsonb),
    'monthly_trend', COALESCE(monthly_trend_data, '[]'::jsonb)
  ) INTO spend_data
  FROM public.member_ledger ml
  WHERE ml.user_id = p_user_id AND ml.activity_type = 'receipt' AND ml.amount IS NOT NULL;

  -- Get entrance data separately
  SELECT jsonb_agg(
    jsonb_build_object(
      'entrance', entrance_slug,
      'visit_count', entrance_count
    )
  ) INTO entrance_data
  FROM (
    SELECT mci.entrance_slug, COUNT(*) as entrance_count
    FROM public.member_check_ins mci
    WHERE mci.user_id = p_user_id
    GROUP BY mci.entrance_slug
    ORDER BY COUNT(*) DESC
    LIMIT 5
  ) entrance_summary;

  -- Get visit times data separately
  SELECT jsonb_agg(
    jsonb_build_object(
      'hour', visit_hour,
      'count', hour_count
    )
  ) INTO visit_times_data
  FROM (
    SELECT 
      EXTRACT(HOUR FROM mci.check_in_timestamp) as visit_hour,
      COUNT(*) as hour_count
    FROM public.member_check_ins mci
    WHERE mci.user_id = p_user_id
    GROUP BY EXTRACT(HOUR FROM mci.check_in_timestamp)
    ORDER BY COUNT(*) DESC
  ) hour_summary;

  -- Get weekly pattern data separately
  SELECT jsonb_agg(
    jsonb_build_object(
      'day_of_week', day_num,
      'count', day_count
    )
  ) INTO weekly_pattern_data
  FROM (
    SELECT 
      EXTRACT(DOW FROM mci.check_in_date) as day_num,
      COUNT(*) as day_count
    FROM public.member_check_ins mci
    WHERE mci.user_id = p_user_id
    GROUP BY EXTRACT(DOW FROM mci.check_in_date)
    ORDER BY EXTRACT(DOW FROM mci.check_in_date)
  ) day_summary;

  -- Get visit patterns
  SELECT jsonb_build_object(
    'total_visits', COUNT(mc.id),
    'current_streak', COALESCE(MAX(ms.current_streak), 0),
    'longest_streak', COALESCE(MAX(ms.longest_streak), 0),
    'favorite_entrances', COALESCE(entrance_data, '[]'::jsonb),
    'visit_times', COALESCE(visit_times_data, '[]'::jsonb),
    'weekly_pattern', COALESCE(weekly_pattern_data, '[]'::jsonb)
  ) INTO visit_data
  FROM public.member_check_ins mc
  LEFT JOIN public.member_streaks ms ON mc.user_id = ms.user_id
  WHERE mc.user_id = p_user_id;

  -- Get engagement metrics
  SELECT jsonb_build_object(
    'push_subscriptions', (
      SELECT COUNT(*) FROM public.push_subscriptions ps
      WHERE ps.user_id = p_user_id AND ps.is_active = true
    ),
    'moments_shared', (
      SELECT COUNT(*) FROM public.member_moments mm
      WHERE mm.user_id = p_user_id
    ),
    'last_activity_date', (
      SELECT MAX(ml.activity_date) FROM public.member_ledger ml
      WHERE ml.user_id = p_user_id
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
  FROM (
    SELECT *
    FROM public.member_ledger ml
    WHERE ml.user_id = p_user_id
    ORDER BY ml.activity_timestamp DESC
    LIMIT 20
  ) recent_activities;

  -- Generate predictive insights
  SELECT jsonb_build_object(
    'churn_risk', 
    CASE 
      WHEN COALESCE((visit_data->>'total_visits')::INTEGER, 0) = 0 THEN 'high'
      WHEN COALESCE((spend_data->>'total_spend')::NUMERIC, 0) = 0 THEN 'high'
      WHEN (engagement_data->>'last_activity_date')::DATE < NOW() - INTERVAL '30 days' THEN 'medium'
      ELSE 'low'
    END,
    'predicted_monthly_spend', 
    CASE 
      WHEN monthly_trend_data IS NOT NULL 
      THEN (
        SELECT AVG((trend_item->>'spend')::NUMERIC) 
        FROM jsonb_array_elements(monthly_trend_data) as trend_item
      )
      ELSE 0
    END,
    'recommendations', ARRAY[
      CASE 
        WHEN COALESCE((spend_data->>'total_spend')::NUMERIC, 0) > 100 THEN 'VIP program candidate'
        WHEN COALESCE((visit_data->>'total_visits')::INTEGER, 0) > 20 THEN 'Loyalty program candidate'
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
$function$;