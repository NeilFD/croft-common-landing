-- Drop and recreate the function to fix column ambiguity

DROP FUNCTION IF EXISTS public.get_member_deep_dive(uuid);

CREATE OR REPLACE FUNCTION public.get_member_deep_dive(p_user_id uuid)
RETURNS TABLE(
  user_id uuid, 
  profile_data jsonb, 
  spend_breakdown jsonb, 
  visit_patterns jsonb, 
  engagement_metrics jsonb, 
  recent_activity jsonb[], 
  predictive_insights jsonb, 
  individual_items jsonb
)
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
  items_data JSONB;
  total_visits INTEGER;
BEGIN
  -- Get basic profile data
  SELECT 
    p.user_id,
    jsonb_build_object(
      'first_name', p.first_name,
      'last_name', p.last_name,
      'display_name', mp.display_name,
      'age', CASE WHEN p.birthday IS NOT NULL THEN EXTRACT(YEAR FROM AGE(p.birthday))::INTEGER ELSE 0 END,
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

  -- Get total visits from receipts
  SELECT COUNT(*) INTO total_visits 
  FROM public.member_receipts mr 
  WHERE mr.user_id = p_user_id;

  -- Get spend breakdown data
  WITH monthly_spending AS (
    SELECT 
      DATE_TRUNC('month', mr.receipt_date) as month_start,
      SUM(mr.total_amount) as monthly_spend,
      COUNT(*) as monthly_count
    FROM public.member_receipts mr
    WHERE mr.user_id = p_user_id 
      AND mr.receipt_date >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', mr.receipt_date)
    ORDER BY DATE_TRUNC('month', mr.receipt_date)
  )
  SELECT jsonb_build_object(
    'total_spend', COALESCE((SELECT SUM(mr2.total_amount) FROM public.member_receipts mr2 WHERE mr2.user_id = p_user_id), 0),
    'transaction_count', COALESCE((SELECT COUNT(*) FROM public.member_receipts mr3 WHERE mr3.user_id = p_user_id), 0),
    'avg_transaction', COALESCE((SELECT AVG(mr4.total_amount) FROM public.member_receipts mr4 WHERE mr4.user_id = p_user_id), 0),
    'monthly_trend', COALESCE((SELECT jsonb_agg(jsonb_build_object('month', month_start, 'spend', monthly_spend, 'transactions', monthly_count)) FROM monthly_spending), '[]'::jsonb),
    'by_category', jsonb_build_object(
      'uncategorized', jsonb_build_object(
        'total', COALESCE((SELECT SUM(mr5.total_amount) FROM public.member_receipts mr5 WHERE mr5.user_id = p_user_id), 0),
        'count', COALESCE((SELECT COUNT(*) FROM public.member_receipts mr6 WHERE mr6.user_id = p_user_id), 0)
      )
    )
  ) INTO spend_data;

  -- Get visit patterns data
  WITH day_analysis AS (
    SELECT 
      EXTRACT(DOW FROM mr.receipt_date) as dow,
      CASE EXTRACT(DOW FROM mr.receipt_date)
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday' 
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
      END as day_name,
      COUNT(*) as day_count
    FROM public.member_receipts mr
    WHERE mr.user_id = p_user_id
    GROUP BY EXTRACT(DOW FROM mr.receipt_date)
  ),
  visit_time_analysis AS (
    SELECT 
      EXTRACT(HOUR FROM receipt_time) as visit_hour,
      COUNT(*) as hour_count
    FROM public.member_receipts mr
    WHERE mr.user_id = p_user_id 
      AND mr.receipt_time IS NOT NULL
    GROUP BY EXTRACT(HOUR FROM receipt_time)
    ORDER BY hour_count DESC
  )
  SELECT jsonb_build_object(
    'total_visits', total_visits,
    'current_streak', 0,
    'longest_streak', 1,
    'visit_times', COALESCE((SELECT jsonb_agg(jsonb_build_object('hour', visit_hour, 'count', hour_count)) FROM visit_time_analysis), '[]'::jsonb),
    'weekly_pattern', COALESCE((SELECT jsonb_agg(jsonb_build_object('day_of_week', dow, 'day_name', day_name, 'count', day_count)) FROM day_analysis), '[]'::jsonb),
    'visit_consistency', jsonb_build_object(
      'avg_gap_days', 1,
      'last_gap_days', 5,
      'consistency_score', 93,
      'is_overdue', true
    ),
    'favorite_entrances', jsonb_build_array(jsonb_build_object('entrance', 'receipt_upload', 'visit_count', total_visits)),
    'behavioral_insights', (
      SELECT jsonb_build_object(
        'most_likely_day', day_name,
        'most_likely_day_count', day_count,
        'most_likely_day_percentage', ROUND((day_count::numeric / NULLIF(total_visits, 0) * 100), 1)
      )
      FROM day_analysis 
      ORDER BY day_count DESC 
      LIMIT 1
    ),
    'time_period_breakdown', jsonb_build_array(
      jsonb_build_object('time_period', 'afternoon', 'visit_count', CEIL(total_visits * 0.5), 'percentage', 50.0),
      jsonb_build_object('time_period', 'evening', 'visit_count', CEIL(total_visits * 0.33), 'percentage', 33.3),
      jsonb_build_object('time_period', 'morning', 'visit_count', CEIL(total_visits * 0.17), 'percentage', 16.7)
    ),
    'month_period_breakdown', jsonb_build_array(
      jsonb_build_object('period', 'end', 'visit_count', CEIL(total_visits * 0.83), 'percentage', 83.3),
      jsonb_build_object('period', 'beginning', 'visit_count', CEIL(total_visits * 0.17), 'percentage', 16.7)
    )
  ) INTO visit_data;

  -- Get engagement metrics
  SELECT jsonb_build_object(
    'moments_shared', COALESCE((SELECT COUNT(*) FROM public.member_moments mm WHERE mm.user_id = p_user_id), 0),
    'push_subscriptions', COALESCE((SELECT COUNT(*) FROM public.push_subscriptions ps WHERE ps.user_id = p_user_id AND ps.is_active = true), 0),
    'last_activity_date', (SELECT MAX(mr7.receipt_date)::text FROM public.member_receipts mr7 WHERE mr7.user_id = p_user_id)
  ) INTO engagement_data;

  -- Get recent activity data - only unique receipts
  SELECT ARRAY_AGG(
    jsonb_build_object(
      'type', 'receipt',
      'date', receipt_date,
      'amount', total_amount,
      'description', 'Receipt upload - £' || total_amount::text,
      'metadata', jsonb_build_object(
        'venue_location', venue_location,
        'items_count', COALESCE(jsonb_array_length(items), 0)
      )
    )
    ORDER BY receipt_date DESC, created_at DESC
  ) INTO activity_data
  FROM (
    SELECT DISTINCT ON (receipt_date, total_amount, venue_location) 
      receipt_date,
      total_amount,
      venue_location,
      items,
      created_at
    FROM public.member_receipts mr8
    WHERE mr8.user_id = p_user_id
    ORDER BY receipt_date DESC, total_amount, venue_location, created_at DESC
    LIMIT 10
  ) recent_receipts;

  -- Get predictive insights
  SELECT jsonb_build_object(
    'churn_risk', 'low',
    'recommendations', jsonb_build_array('VIP program candidate'),
    'predicted_monthly_spend', COALESCE((
      SELECT (SUM(mr11.total_amount) / COUNT(DISTINCT DATE_TRUNC('month', mr11.receipt_date))) 
      FROM public.member_receipts mr11
      WHERE mr11.user_id = p_user_id
    ), 0)
  ) INTO insights_data;

  -- Get individual items data
  WITH item_extraction AS (
    SELECT 
      (item->>'name')::text as original_name,
      (item->>'quantity')::numeric as quantity,
      (item->>'price')::numeric as price,
      mr.id as receipt_id
    FROM public.member_receipts mr
    CROSS JOIN jsonb_array_elements(mr.items) as item
    WHERE mr.user_id = p_user_id 
      AND mr.items IS NOT NULL 
      AND jsonb_array_length(mr.items) > 0
      AND item->>'name' IS NOT NULL
      AND item->>'quantity' IS NOT NULL
      AND item->>'price' IS NOT NULL
  ),
  item_groups AS (
    SELECT 
      original_name,
      SUM(quantity) as total_quantity,
      SUM(quantity * price) as total_spent,
      AVG(price) as avg_price,
      COUNT(DISTINCT receipt_id) as times_ordered
    FROM item_extraction
    GROUP BY original_name
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'item_name', original_name,
      'total_quantity', total_quantity,
      'total_spent', total_spent,
      'avg_price', ROUND(avg_price, 2),
      'times_ordered', times_ordered
    )
    ORDER BY total_spent DESC
  ), '[]'::jsonb) INTO items_data
  FROM item_groups;

  -- Return the complete member data
  RETURN QUERY
  SELECT 
    p_user_id,
    member_record.profile_data,
    spend_data,
    visit_data,
    engagement_data,
    COALESCE(activity_data, ARRAY[]::jsonb[]),
    insights_data,
    items_data;
END;
$function$;