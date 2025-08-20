-- Complete user data wipe - clears all user-related data and starts fresh
-- This will delete ALL users and ALL related data permanently

-- Step 1: Clear all dependent tables first (to avoid foreign key violations)

-- Clear loyalty system data
DELETE FROM loyalty_entries;
DELETE FROM loyalty_cards;

-- Clear cinema booking data
DELETE FROM cinema_bookings;

-- Clear push notification data
DELETE FROM push_subscriptions;
DELETE FROM push_optin_events;
DELETE FROM notification_deliveries;

-- Clear events and notifications
DELETE FROM events;
DELETE FROM notifications;

-- Clear analytics and tracking data
DELETE FROM page_views;
DELETE FROM user_interactions;
DELETE FROM user_journeys;
DELETE FROM user_sessions;

-- Clear pong scores (user_id can be null so safe to clear)
DELETE FROM pong_scores WHERE user_id IS NOT NULL;

-- Clear user profiles and subscribers
DELETE FROM profiles;
DELETE FROM subscribers;

-- Clear WebAuthn authentication data
DELETE FROM webauthn_challenges;
DELETE FROM webauthn_credentials;

-- Clear membership system data
DELETE FROM membership_codes;
DELETE FROM membership_links;

-- Clear pending banners (if they reference user data)
DELETE FROM pending_banners;

-- Step 2: Delete all users from auth.users table
-- This requires service role permissions
DELETE FROM auth.users;

-- Step 3: Reset any sequences if needed (optional, but good for clean slate)
-- Most tables use uuid primary keys with gen_random_uuid() so no sequences to reset

-- Log the cleanup completion
DO $$
BEGIN
  RAISE NOTICE 'Complete user data wipe completed successfully. All users and related data have been deleted.';
END $$;