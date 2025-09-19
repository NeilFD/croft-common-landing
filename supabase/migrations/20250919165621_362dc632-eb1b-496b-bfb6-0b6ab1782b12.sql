-- Fix member ledger duplicates and improve visit frequency calculation

-- First, clean up duplicate ledger entries
WITH duplicates_to_remove AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, activity_type, activity_date, amount, related_id 
      ORDER BY created_at
    ) as row_num
  FROM member_ledger
  WHERE activity_type IN ('receipt', 'lunch_order')
    AND related_id IS NOT NULL
)
DELETE FROM member_ledger 
WHERE id IN (
  SELECT id FROM duplicates_to_remove WHERE row_num > 1
);

-- Update the receipt ledger trigger to prevent duplicates
CREATE OR REPLACE FUNCTION public.update_ledger_on_receipt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only insert if no ledger entry already exists for this exact receipt
  IF NOT EXISTS (
    SELECT 1 FROM public.member_ledger 
    WHERE related_id = NEW.id 
      AND activity_type = 'receipt'
      AND user_id = NEW.user_id
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

-- Update the lunch order ledger trigger to prevent duplicates
CREATE OR REPLACE FUNCTION public.add_lunch_order_to_ledger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only process if order is confirmed (not pending)
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    
    -- Add to ledger with proper duplicate prevention
    INSERT INTO public.member_ledger (
      user_id, 
      activity_type, 
      activity_date, 
      amount, 
      currency, 
      description, 
      related_id, 
      metadata
    )
    SELECT 
      NEW.user_id,
      'lunch_order',
      NEW.order_date,
      NEW.total_amount,
      'GBP',
      'Lunch Run order - £' || NEW.total_amount::text,
      NEW.id,
      jsonb_build_object(
        'collection_time', NEW.collection_time,
        'items', NEW.items,
        'member_name', NEW.member_name
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM public.member_ledger 
      WHERE related_id = NEW.id 
        AND activity_type = 'lunch_order'
        AND user_id = NEW.user_id
    );
    
    -- Add check-in for streak if spend is £8 or more
    IF NEW.total_amount >= 8.00 THEN
      -- Insert check-in only if one doesn't exist for this date
      INSERT INTO public.member_check_ins (
        user_id,
        check_in_date,
        entrance_slug,
        streak_day
      )
      VALUES (
        NEW.user_id,
        NEW.order_date,
        'lunch_run',
        1  -- Will be updated by streak calculation trigger
      )
      ON CONFLICT (user_id, check_in_date) DO NOTHING;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update the advanced analytics function to calculate proper visit frequency
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
  p_engagement_logic text DEFAULT 'any_match'
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
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH base_members AS (
    SELECT 
      p.user_id,
      p.first_name,
      p.last_name,
      COALESCE(mp.display_name, CONCAT(p.first_name, ' ', p.last_name)) as display_name,
      CASE WHEN p.birthday IS NOT NULL THEN EXTRACT(YEAR FROM AGE(p.birthday))::INTEGER ELSE NULL END as age,
      p.interests,
      COALESCE(mp.tier_badge, 'bronze') as tier_badge,
      mp.favorite_venue
    FROM public.profiles p
    LEFT JOIN public.member_profiles_extended mp ON p.user_id = mp.user_id
  ),
  spending_data AS (
    SELECT 
      ml.user_id,
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
    FROM public.member_ledger ml
    WHERE ml.amount IS NOT NULL AND ml.amount > 0
    GROUP BY ml.user_id, ml.currency
  ),
  visit_data AS (
    SELECT 
      mc.user_id,
      COUNT(*) as total_visits,
      MAX(mc.check_in_date) as last_visit_date,
      -- Calculate visits per week based on the span between first and last visit
      CASE 
        WHEN COUNT(*) > 1 THEN 
          ROUND(
            COUNT(*)::numeric / GREATEST(
              EXTRACT(EPOCH FROM (MAX(mc.check_in_date) - MIN(mc.check_in_date)))::numeric / (7 * 24 * 3600),
              1
            ), 
            2
          )
        ELSE 0
      END as visit_frequency
    FROM public.member_check_ins mc
    GROUP BY mc.user_id
  ),
  combined_data AS (
    SELECT 
      bm.user_id,
      bm.first_name,
      bm.last_name,
      bm.display_name,
      bm.age,
      bm.interests,
      bm.tier_badge,
      COALESCE(sd.total_transactions, 0) as total_transactions,
      COALESCE(sd.total_spend, 0) as total_spend,
      COALESCE(sd.avg_transaction, 0) as avg_transaction,
      sd.first_transaction_date,
      sd.last_transaction_date,
      COALESCE(sd.active_months, 0) as active_months,
      COALESCE(sd.active_days, 0) as active_days,
      COALESCE(sd.categories, ARRAY[]::text[]) as categories,
      COALESCE(sd.payment_methods, ARRAY[]::text[]) as payment_methods,
      COALESCE(sd.currency, 'GBP') as currency,
      COALESCE(sd.current_month_spend, 0) as current_month_spend,
      COALESCE(sd.current_week_spend, 0) as current_week_spend,
      COALESCE(sd.current_month_transactions, 0) as current_month_transactions,
      CASE WHEN bm.favorite_venue IS NOT NULL THEN ARRAY[bm.favorite_venue] ELSE ARRAY[]::text[] END as favorite_venues,
      COALESCE(vd.visit_frequency, 0) as visit_frequency,
      vd.last_visit_date,
      ARRAY[]::text[] as preferred_visit_times,
      -- Simple retention risk based on days since last activity
      CASE 
        WHEN COALESCE(sd.last_transaction_date, vd.last_visit_date) IS NULL THEN 1.0
        WHEN CURRENT_DATE - COALESCE(sd.last_transaction_date, vd.last_visit_date) > 30 THEN 0.8
        WHEN CURRENT_DATE - COALESCE(sd.last_transaction_date, vd.last_visit_date) > 14 THEN 0.4
        ELSE 0.1
      END as retention_risk_score,
      COALESCE(sd.total_spend, 0) as lifetime_value
    FROM base_members bm
    LEFT JOIN spending_data sd ON bm.user_id = sd.user_id
    LEFT JOIN visit_data vd ON bm.user_id = vd.user_id
    WHERE (sd.user_id IS NOT NULL OR vd.user_id IS NOT NULL) -- Only include members with activity
  )
  SELECT 
    cd.user_id,
    cd.first_name,
    cd.last_name,
    cd.display_name,
    cd.age,
    cd.interests,
    cd.tier_badge,
    cd.total_transactions,
    cd.total_spend,
    cd.avg_transaction,
    cd.first_transaction_date,
    cd.last_transaction_date,
    cd.active_months,
    cd.active_days,
    cd.categories,
    cd.payment_methods,
    cd.currency,
    cd.current_month_spend,
    cd.current_week_spend,
    cd.current_month_transactions,
    cd.favorite_venues,
    cd.visit_frequency,
    cd.last_visit_date,
    cd.preferred_visit_times,
    cd.retention_risk_score,
    cd.lifetime_value
  FROM combined_data cd
  -- Apply basic filters (keeping the same logic as before but now with correct visit frequency)
  WHERE 1=1
    AND (p_date_start IS NULL OR cd.last_transaction_date >= p_date_start)
    AND (p_date_end IS NULL OR cd.first_transaction_date <= p_date_end)
    AND (p_min_age IS NULL OR cd.age >= p_min_age)
    AND (p_max_age IS NULL OR cd.age <= p_max_age)
    AND (p_min_spend IS NULL OR cd.total_spend >= p_min_spend)
    AND (p_max_spend IS NULL OR cd.total_spend <= p_max_spend)
    AND (p_tier_badges IS NULL OR cd.tier_badge = ANY(p_tier_badges))
  ORDER BY cd.total_spend DESC;
END;
$function$;