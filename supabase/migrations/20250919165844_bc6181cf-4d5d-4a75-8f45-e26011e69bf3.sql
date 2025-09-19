-- Better duplicate cleanup for member ledger
-- Remove all receipt and lunch order entries and let the triggers recreate them properly
WITH neil_user AS (
  SELECT user_id FROM profiles WHERE first_name = 'Neil' LIMIT 1
)
DELETE FROM member_ledger 
WHERE user_id IN (SELECT user_id FROM neil_user)
  AND activity_type IN ('receipt', 'lunch_order');

-- Now manually recreate the correct ledger entries from source tables
WITH neil_user AS (
  SELECT user_id FROM profiles WHERE first_name = 'Neil' LIMIT 1
)
INSERT INTO member_ledger (user_id, activity_type, activity_date, amount, currency, description, related_id, metadata)
SELECT 
  mr.user_id,
  'receipt',
  mr.receipt_date,
  mr.total_amount,
  mr.currency,
  'Receipt upload - £' || mr.total_amount::text,
  mr.id,
  jsonb_build_object('venue_location', mr.venue_location, 'items_count', jsonb_array_length(COALESCE(mr.items, '[]'::jsonb)))
FROM member_receipts mr, neil_user nu
WHERE mr.user_id = nu.user_id;

-- Insert lunch order entries
WITH neil_user AS (
  SELECT user_id FROM profiles WHERE first_name = 'Neil' LIMIT 1  
)
INSERT INTO member_ledger (user_id, activity_type, activity_date, amount, currency, description, related_id, metadata)
SELECT 
  lo.user_id,
  'lunch_order',
  lo.order_date,
  lo.total_amount,
  'GBP',
  'Lunch Run order - £' || lo.total_amount::text,
  lo.id,
  jsonb_build_object(
    'collection_time', lo.collection_time,
    'items', lo.items,
    'member_name', lo.member_name
  )
FROM lunch_orders lo, neil_user nu
WHERE lo.user_id = nu.user_id 
  AND lo.status = 'confirmed';