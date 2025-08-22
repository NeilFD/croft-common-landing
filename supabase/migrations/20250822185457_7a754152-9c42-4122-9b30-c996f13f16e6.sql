-- Clean up duplicate push subscriptions, keeping only the most recent per user
WITH ranked_subscriptions AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM push_subscriptions 
  WHERE is_active = true 
    AND user_id IS NOT NULL
)
UPDATE push_subscriptions 
SET is_active = false
WHERE id IN (
  SELECT id 
  FROM ranked_subscriptions 
  WHERE rn > 1
);

-- Log the cleanup
DO $$
DECLARE
  deactivated_count INTEGER;
BEGIN
  GET DIAGNOSTICS deactivated_count = ROW_COUNT;
  RAISE NOTICE 'Deactivated % duplicate push subscriptions', deactivated_count;
END $$;