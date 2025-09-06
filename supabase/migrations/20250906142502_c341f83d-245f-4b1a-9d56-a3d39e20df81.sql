-- Update the member segments function to only include real active members
CREATE OR REPLACE FUNCTION public.get_member_segments()
RETURNS TABLE(
  segment_name text, 
  segment_description text, 
  member_count bigint, 
  avg_spend numeric, 
  criteria jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
        -- Only include users with actual activity
        AND (ml.amount > 0 OR mc.check_in_date IS NOT NULL)
      GROUP BY ml.user_id
      HAVING SUM(CASE WHEN ml.amount > 0 THEN ml.amount ELSE 0 END) >= 200
        AND COUNT(DISTINCT mc.check_in_date) >= 10
    ) hvr
    
    UNION ALL
    
    SELECT 
      'New Active Members' as segment_name,
      'Recently joined members with activity' as segment_description,
      COUNT(*) as member_count,
      AVG(COALESCE(total_spend, 0)) as avg_spend,
      jsonb_build_object(
        'join_days', 30,
        'criteria', 'joined within last 30 days with activity'
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
      -- Only include those with some activity
      AND (
        spend.total_spend > 0 
        OR EXISTS (SELECT 1 FROM public.member_check_ins mc WHERE mc.user_id = mp.user_id)
      )
    
    UNION ALL
    
    SELECT 
      'At Risk Active Members' as segment_name,
      'Previously active members with declining activity' as segment_description,
      COUNT(*) as member_count,
      AVG(COALESCE(total_spend, 0)) as avg_spend,
      jsonb_build_object(
        'last_activity_days', 14,
        'criteria', 'had activity but none in last 14 days'
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
    WHERE activity.last_activity IS NOT NULL  -- Had activity before
      AND activity.last_activity < NOW() - INTERVAL '14 days'  -- But not recently
      AND (
        activity.total_spend > 0 
        OR EXISTS (SELECT 1 FROM public.member_check_ins mc WHERE mc.user_id = p.user_id)
      )
  )
  SELECT * FROM segment_data
  WHERE member_count > 0;  -- Only show segments with actual members
END;
$function$;