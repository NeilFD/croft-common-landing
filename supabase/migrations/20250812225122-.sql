-- Clean up anonymous push subscriptions and their delivery records
-- This will leave only authenticated subscriptions for clean testing

-- First, delete notification deliveries for anonymous subscriptions
DELETE FROM notification_deliveries 
WHERE subscription_id IN (
  SELECT id FROM push_subscriptions WHERE user_id IS NULL
);

-- Then delete the anonymous push subscriptions themselves
DELETE FROM push_subscriptions 
WHERE user_id IS NULL;