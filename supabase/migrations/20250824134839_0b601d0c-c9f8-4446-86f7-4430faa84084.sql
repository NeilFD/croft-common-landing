-- First, restore subscriptions that were incorrectly deactivated
-- Find users with no active subscriptions but recent inactive ones
WITH users_needing_restoration AS (
  SELECT DISTINCT ps.user_id
  FROM push_subscriptions ps
  WHERE ps.user_id IS NOT NULL
    AND ps.user_id NOT IN (
      SELECT user_id 
      FROM push_subscriptions 
      WHERE is_active = true AND user_id IS NOT NULL
    )
),
latest_per_user AS (
  SELECT DISTINCT ON (ps.user_id) 
    ps.id,
    ps.user_id,
    ps.created_at
  FROM push_subscriptions ps
  INNER JOIN users_needing_restoration unr ON ps.user_id = unr.user_id
  WHERE ps.user_id IS NOT NULL
  ORDER BY ps.user_id, ps.created_at DESC
)
UPDATE push_subscriptions 
SET is_active = true, last_seen = now()
WHERE id IN (SELECT id FROM latest_per_user);

-- Log the restoration
DO $$
DECLARE
  restored_count INTEGER;
BEGIN
  GET DIAGNOSTICS restored_count = ROW_COUNT;
  RAISE NOTICE 'Restored % incorrectly deactivated push subscriptions', restored_count;
END $$;