-- Allow native push tokens to be saved without web-push specific fields
ALTER TABLE public.push_subscriptions 
  ALTER COLUMN p256dh DROP NOT NULL,
  ALTER COLUMN auth DROP NOT NULL;

-- Add constraint to ensure data integrity: either web-push fields are present OR it's a native token
ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscription_type_check
  CHECK (
    (p256dh IS NOT NULL AND auth IS NOT NULL) OR 
    (endpoint LIKE 'ios-token:%' OR endpoint LIKE 'android-token:%')
  );