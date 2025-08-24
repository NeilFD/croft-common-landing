-- Create a function to get push notification subscribers with their details
CREATE OR REPLACE FUNCTION get_push_subscribers()
RETURNS TABLE (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  subscriber_name text,
  platform text,
  created_at timestamptz,
  last_seen timestamptz,
  device_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.user_id,
    COALESCE(
      (SELECT au.email FROM auth.users au WHERE au.id = ps.user_id),
      s.email
    ) as email,
    p.first_name,
    p.last_name,
    s.name as subscriber_name,
    ps.platform,
    MIN(ps.created_at) as created_at,
    MAX(ps.last_seen) as last_seen,
    COUNT(*) as device_count
  FROM push_subscriptions ps
  LEFT JOIN profiles p ON p.user_id = ps.user_id
  LEFT JOIN subscribers s ON s.email = (
    SELECT au.email FROM auth.users au WHERE au.id = ps.user_id
  )
  WHERE ps.is_active = true
  GROUP BY 
    ps.user_id, 
    COALESCE(
      (SELECT au.email FROM auth.users au WHERE au.id = ps.user_id),
      s.email
    ),
    p.first_name,
    p.last_name,
    s.name,
    ps.platform
  ORDER BY MIN(ps.created_at) DESC;
END;
$$;