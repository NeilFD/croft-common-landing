-- Add native push token support to push_subscriptions table
-- This allows the table to store both web push subscriptions and native APNs/FCM tokens

-- Add new columns for native tokens
ALTER TABLE public.push_subscriptions 
  ADD COLUMN IF NOT EXISTS apns_token TEXT,
  ADD COLUMN IF NOT EXISTS fcm_token TEXT,
  ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb;

-- Make web push fields nullable since native doesn't use them
ALTER TABLE public.push_subscriptions 
  ALTER COLUMN p256dh DROP NOT NULL,
  ALTER COLUMN auth DROP NOT NULL,
  ALTER COLUMN endpoint DROP NOT NULL;

-- Drop the unique constraint on endpoint (since native tokens won't use it)
DROP INDEX IF EXISTS push_subscriptions_endpoint_key;

-- Create unique indexes for each token type
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_apns_token_key 
  ON public.push_subscriptions (apns_token) 
  WHERE apns_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_fcm_token_key 
  ON public.push_subscriptions (fcm_token) 
  WHERE fcm_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_key 
  ON public.push_subscriptions (endpoint) 
  WHERE endpoint IS NOT NULL;

-- Add a check constraint to ensure at least one token/endpoint is present
ALTER TABLE public.push_subscriptions 
  ADD CONSTRAINT push_subscriptions_token_check 
  CHECK (
    endpoint IS NOT NULL OR 
    apns_token IS NOT NULL OR 
    fcm_token IS NOT NULL
  );

-- Update the platform field to support native platforms
-- Existing values: 'web', 'native-ios', etc.
-- New values: 'ios_native', 'android_native'

COMMENT ON COLUMN public.push_subscriptions.platform IS 'Platform: web, ios_native, android_native';
COMMENT ON COLUMN public.push_subscriptions.apns_token IS 'APNs device token for iOS native push';
COMMENT ON COLUMN public.push_subscriptions.fcm_token IS 'FCM device token for Android native push';
COMMENT ON COLUMN public.push_subscriptions.device_info IS 'Device metadata (model, app_version, session_id)';