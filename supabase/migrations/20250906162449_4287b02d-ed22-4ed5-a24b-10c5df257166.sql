-- Enable pg_trgm extension for similarity functions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create item normalization function
CREATE OR REPLACE FUNCTION public.normalize_item_name(item_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Return null if input is null or empty
  IF item_name IS NULL OR LENGTH(TRIM(item_name)) = 0 THEN
    RETURN NULL;
  END IF;
  
  RETURN LOWER(
    TRIM(
      -- Replace multiple spaces with single space
      REGEXP_REPLACE(
        -- Replace common abbreviations and symbols
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(item_name, '\s*&\s*', ' and ', 'gi'),
            '\s*\+\s*', ' plus ', 'gi'
          ),
          -- Remove common noise words at start/end
          '^\s*(the|a|an)\s+|\s+(the|a|an)\s*$', '', 'gi'
        ),
        '\s+', ' ', 'g'
      )
    )
  );
END;
$$;

-- Create function to find the most representative name from a group
CREATE OR REPLACE FUNCTION public.get_representative_item_name(names text[])
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  name_counts record;
  result text;
BEGIN
  -- Get the most frequent name, preferring proper case over all caps
  SELECT item_name INTO result
  FROM (
    SELECT 
      unnest(names) as item_name,
      COUNT(*) as frequency,
      -- Prefer mixed case over all caps, then by frequency
      CASE 
        WHEN unnest(names) ~ '[a-z]' THEN 2  -- Has lowercase letters
        WHEN unnest(names) ~ '^[A-Z\s&]+$' THEN 1  -- All caps
        ELSE 0
      END as case_preference
    FROM unnest(names) as item_name
    GROUP BY unnest(names)
    ORDER BY frequency DESC, case_preference DESC, item_name
    LIMIT 1
  ) ranked;
  
  RETURN COALESCE(result, names[1]);
END;
$$;

-- Update the get_member_deep_dive function with fuzzy matching
CREATE OR REPLACE FUNCTION public.get_member_deep_dive(p_user_id uuid)
RETURNS TABLE(user_id uuid, profile_data jsonb, spend_breakdown jsonb, visit_patterns jsonb, engagement_metrics jsonb, recent_activity jsonb[], predictive_insights jsonb, individual_items jsonb)
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
  monthly_trend_data JSONB;
  category_breakdown JSONB;
  entrance_data JSONB;
  visit_times_data JSONB;
  weekly_pattern_data JSONB;
  items_data JSONB;
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

  -- Get individual items data with fuzzy matching and deduplication
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
  normalized_items AS (
    SELECT 
      original_name,
      normalize_item_name(original_name) as normalized_name,
      quantity,
      price,
      receipt_id
    FROM item_extraction
    WHERE normalize_item_name(original_name) IS NOT NULL
  ),
  similarity_groups AS (
    SELECT DISTINCT
      n1.normalized_name as group_key,
      n2.normalized_name as member_name,
      n2.original_name,
      n2.quantity,
      n2.price,
      n2.receipt_id
    FROM normalized_items n1
    JOIN normalized_items n2 ON (
      n1.normalized_name = n2.normalized_name OR 
      similarity(n1.normalized_name, n2.normalized_name) >= 0.7
    )
    WHERE n1.normalized_name <= n2.normalized_name  -- Avoid duplicates
  ),
  item_groups AS (
    SELECT 
      group_key,
      array_agg(DISTINCT original_name) as all_names,
      SUM(quantity) as total_quantity,
      SUM(quantity * price) as total_spent,
      AVG(price) as avg_price,
      COUNT(DISTINCT receipt_id) as times_ordered
    FROM similarity_groups
    GROUP BY group_key
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'item_name', get_representative_item_name(ig.all_names),
      'total_quantity', ig.total_quantity,
      'total_spent', ig.total_spent,
      'avg_price', ROUND(ig.avg_price, 2),
      'times_ordered', ig.times_ordered
    )
    ORDER BY ig.total_spent DESC
  ) INTO items_data
  FROM item_groups ig
  LIMIT 10;

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
    insights_data,
    COALESCE(items_data, '[]'::jsonb) as individual_items;
END;
$$;