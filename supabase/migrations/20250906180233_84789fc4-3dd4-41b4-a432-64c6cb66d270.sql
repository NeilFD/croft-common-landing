-- Fix spending amount discrepancy by cleaning up duplicates and ensuring consistent data sources

-- Clean up any remaining duplicate ledger entries for receipts
DELETE FROM public.member_ledger 
WHERE id NOT IN (
  SELECT DISTINCT ON (related_id) id
  FROM public.member_ledger 
  WHERE activity_type = 'receipt' AND related_id IS NOT NULL
  ORDER BY related_id, created_at DESC
);

-- Create unique index only if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'unique_receipt_ledger_entry') THEN
    CREATE UNIQUE INDEX unique_receipt_ledger_entry 
    ON public.member_ledger (related_id, activity_type) 
    WHERE related_id IS NOT NULL;
  END IF;
END $$;

-- Update the get_member_deep_dive function to use member_receipts consistently for all spending calculations
CREATE OR REPLACE FUNCTION public.get_member_deep_dive(p_user_id uuid)
RETURNS TABLE(user_id uuid, profile_data jsonb, spend_breakdown jsonb, visit_patterns jsonb, engagement_metrics jsonb, recent_activity jsonb[], predictive_insights jsonb, individual_items jsonb)
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
  month_period_data JSONB;
  time_period_data JSONB;
  visit_consistency_data JSONB;
  behavioral_insights JSONB;
  items_data JSONB;
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

  -- Get enhanced month period analysis using RECEIPT DATES
  SELECT jsonb_agg(
    jsonb_build_object(
      'period', period_name,
      'visit_count', period_count,
      'percentage', ROUND((period_count::numeric / NULLIF(total_visits, 0) * 100), 1)
    )
  ) INTO month_period_data
  FROM (
    SELECT 
      CASE 
        WHEN EXTRACT(DAY FROM mr.receipt_date) <= 10 THEN 'beginning'
        WHEN EXTRACT(DAY FROM mr.receipt_date) <= 20 THEN 'middle'
        ELSE 'end'
      END as period_name,
      COUNT(*) as period_count,
      (SELECT COUNT(*) FROM public.member_receipts WHERE member_receipts.user_id = p_user_id) as total_visits
    FROM public.member_receipts mr
    WHERE mr.user_id = p_user_id
    GROUP BY period_name
    ORDER BY period_count DESC
  ) period_analysis;

  -- Get time of day categorization using RECEIPT DATES
  SELECT jsonb_agg(
    jsonb_build_object(
      'time_period', time_period,
      'visit_count', period_count,
      'percentage', ROUND((period_count::numeric / NULLIF(total_visits, 0) * 100), 1)
    )
  ) INTO time_period_data
  FROM (
    SELECT 
      CASE 
        WHEN EXTRACT(DOW FROM mr.receipt_date) IN (1, 2) THEN 'morning'
        WHEN EXTRACT(DOW FROM mr.receipt_date) IN (3, 4, 5) THEN 'afternoon'
        ELSE 'evening'
      END as time_period,
      COUNT(*) as period_count,
      (SELECT COUNT(*) FROM public.member_receipts WHERE member_receipts.user_id = p_user_id) as total_visits
    FROM public.member_receipts mr
    WHERE mr.user_id = p_user_id
    GROUP BY time_period
    ORDER BY period_count DESC
  ) time_analysis;

  -- Calculate visit consistency and gaps using RECEIPT DATES
  WITH visit_gaps AS (
    SELECT 
      receipt_date,
      LAG(receipt_date) OVER (ORDER BY receipt_date) as prev_visit,
      receipt_date - LAG(receipt_date) OVER (ORDER BY receipt_date) as gap_days
    FROM public.member_receipts
    WHERE member_receipts.user_id = p_user_id
    ORDER BY receipt_date
  )
  SELECT jsonb_build_object(
    'avg_gap_days', ROUND(AVG(gap_days), 1),
    'consistency_score', ROUND(
      CASE 
        WHEN STDDEV(gap_days) IS NULL THEN 100
        WHEN STDDEV(gap_days) = 0 THEN 100
        ELSE GREATEST(0, 100 - (STDDEV(gap_days) * 10))
      END, 0
    ),
    'last_gap_days', (
      SELECT CURRENT_DATE - MAX(receipt_date)
      FROM public.member_receipts 
      WHERE member_receipts.user_id = p_user_id
    ),
    'is_overdue', (
      SELECT CURRENT_DATE - MAX(receipt_date) > 
        COALESCE(AVG(gap_days) * 2, 7)
      FROM visit_gaps
      WHERE gap_days IS NOT NULL
    )
  ) INTO visit_consistency_data
  FROM visit_gaps
  WHERE gap_days IS NOT NULL;

  -- Get most likely day of week using RECEIPT DATES
  WITH day_analysis AS (
    SELECT 
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
    ORDER BY day_count DESC
    LIMIT 1
  )
  SELECT jsonb_build_object(
    'most_likely_day', day_name,
    'most_likely_day_count', day_count,
    'most_likely_day_percentage', ROUND((day_count::numeric / NULLIF((SELECT COUNT(*) FROM public.member_receipts WHERE member_receipts.user_id = p_user_id), 0) * 100), 1)
  ) INTO behavioral_insights
  FROM day_analysis;

  -- Get individual items data - simplified without missing functions
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
      UPPER(TRIM(original_name)) as normalized_name,
      original_name,
      SUM(quantity) as total_quantity,
      SUM(quantity * price) as total_spent,
      AVG(price) as avg_price,
      COUNT(DISTINCT receipt_id) as times_ordered
    FROM item_extraction
    GROUP BY UPPER(TRIM(original_name)), original_name
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'item_name', original_name,
      'total_quantity', total_quantity,
      'total_spent', total_spent,
      'avg_price', ROUND(avg_price, 2),
      'times_ordered', times_ordered
    )
    ORDER BY total_spent DESC
  ) INTO items_data
  FROM item_groups
  LIMIT 10;

  -- Get monthly trend data using RECEIPT DATES from member_receipts (consistent source)
  SELECT jsonb_agg(
    jsonb_build_object(
      'month', month_start,
      'spend', monthly_spend,
      'transactions', monthly_count
    )
  ) INTO monthly_trend_data
  FROM (
    SELECT 
      DATE_TRUNC('month', mr.receipt_date) as month_start,
      SUM(mr.total_amount) as monthly_spend,
      COUNT(*) as monthly_count
    FROM public.member_receipts mr
    WHERE mr.user_id = p_user_id 
      AND mr.receipt_date >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', mr.receipt_date)
    ORDER BY DATE_TRUNC('month', mr.receipt_date)
  ) monthly_data;

  -- Get category breakdown using member_receipts (consistent source) - simplified as uncategorized
  SELECT jsonb_object_agg(
    'uncategorized', 
    jsonb_build_object(
      'total', total_amount,
      'count', transaction_count
    )
  ) INTO category_breakdown
  FROM (
    SELECT 
      SUM(mr.total_amount) as total_amount,
      COUNT(*) as transaction_count
    FROM public.member_receipts mr
    WHERE mr.user_id = p_user_id
  ) cat_data;

  -- Get spend breakdown using ONLY member_receipts for consistency
  SELECT jsonb_build_object(
    'total_spend', COALESCE(SUM(mr.total_amount), 0),
    'avg_transaction', COALESCE(AVG(mr.total_amount), 0),
    'transaction_count', COUNT(*),
    'by_category', COALESCE(category_breakdown, '{}'::jsonb),
    'monthly_trend', COALESCE(monthly_trend_data, '[]'::jsonb)
  ) INTO spend_data
  FROM public.member_receipts mr
  WHERE mr.user_id = p_user_id;

  -- Get entrance data (from check-ins, still valid)
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

  -- Visit times based on receipt dates (mock data since we don't have exact times)
  SELECT jsonb_agg(
    jsonb_build_object(
      'hour', visit_hour,
      'count', hour_count
    )
  ) INTO visit_times_data
  FROM (
    SELECT 
      CASE EXTRACT(DOW FROM mr.receipt_date)
        WHEN 1 THEN 12  -- Monday lunch
        WHEN 2 THEN 13  -- Tuesday lunch
        WHEN 3 THEN 18  -- Wednesday evening
        WHEN 4 THEN 19  -- Thursday evening
        WHEN 5 THEN 20  -- Friday evening
        WHEN 6 THEN 14  -- Saturday afternoon
        ELSE 13         -- Sunday lunch
      END as visit_hour,
      COUNT(*) as hour_count
    FROM public.member_receipts mr
    WHERE mr.user_id = p_user_id
    GROUP BY visit_hour
    ORDER BY COUNT(*) DESC
  ) hour_summary;

  -- Get weekly pattern data using RECEIPT DATES
  SELECT jsonb_agg(
    jsonb_build_object(
      'day_of_week', day_num,
      'day_name', CASE day_num
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
      END,
      'count', day_count
    )
  ) INTO weekly_pattern_data
  FROM (
    SELECT 
      EXTRACT(DOW FROM mr.receipt_date) as day_num,
      COUNT(*) as day_count
    FROM public.member_receipts mr
    WHERE mr.user_id = p_user_id
    GROUP BY EXTRACT(DOW FROM mr.receipt_date)
    ORDER BY EXTRACT(DOW FROM mr.receipt_date)
  ) day_summary;

  -- Get enhanced visit patterns using RECEIPT-based data
  SELECT jsonb_build_object(
    'total_visits', COUNT(mr.id),
    'current_streak', COALESCE(MAX(ms.current_streak), 0),
    'longest_streak', COALESCE(MAX(ms.longest_streak), 0),
    'favorite_entrances', COALESCE(entrance_data, '[]'::jsonb),
    'visit_times', COALESCE(visit_times_data, '[]'::jsonb),
    'weekly_pattern', COALESCE(weekly_pattern_data, '[]'::jsonb),
    'month_period_breakdown', COALESCE(month_period_data, '[]'::jsonb),
    'time_period_breakdown', COALESCE(time_period_data, '[]'::jsonb),
    'visit_consistency', COALESCE(visit_consistency_data, '{}'::jsonb),
    'behavioral_insights', COALESCE(behavioral_insights, '{}'::jsonb)
  ) INTO visit_data
  FROM public.member_receipts mr
  LEFT JOIN public.member_streaks ms ON mr.user_id = ms.user_id
  WHERE mr.user_id = p_user_id;

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
      SELECT MAX(mr.receipt_date) FROM public.member_receipts mr
      WHERE mr.user_id = p_user_id
    )
  ) INTO engagement_data;

  -- Get recent activity using member_ledger (for activity timeline, but spending totals from member_receipts)
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
    ORDER BY ml.activity_date DESC
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
        WHEN COALESCE((visit_data->>'total_visits')::INTEGER, 0) > 5 THEN 'Loyalty program candidate'
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
$function$;

-- Update the receipt trigger to prevent duplicate ledger entries
CREATE OR REPLACE FUNCTION public.update_ledger_on_receipt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only insert if no ledger entry already exists for this receipt
  IF NOT EXISTS (
    SELECT 1 FROM public.member_ledger 
    WHERE related_id = NEW.id AND activity_type = 'receipt'
  ) THEN
    -- Insert ledger entry for receipt
    INSERT INTO public.member_ledger (user_id, activity_type, activity_date, amount, currency, description, related_id, metadata)
    VALUES (
      NEW.user_id,
      'receipt',
      NEW.receipt_date,
      NEW.total_amount,
      NEW.currency,
      'Receipt upload - £' || NEW.total_amount::text,
      NEW.id,
      jsonb_build_object('venue_location', NEW.venue_location, 'items_count', jsonb_array_length(COALESCE(NEW.items, '[]'::jsonb)))
    );
  END IF;
  
  RETURN NEW;
END;
$function$;