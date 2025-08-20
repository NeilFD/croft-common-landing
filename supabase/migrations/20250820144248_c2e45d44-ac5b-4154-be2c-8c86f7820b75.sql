-- SAFE user data wipe - preserves all CMS content while clearing users
-- This will delete ALL users but preserve all site content and functionality

-- Step 1: Preserve CMS content by clearing created_by references (not deleting content)
UPDATE cms_content SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE cms_images SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE cms_menu_items SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE cms_menu_sections SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE cms_faq_content SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE cms_global_content SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE cms_modal_content SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE cms_design_tokens SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE cms_brand_assets SET created_by = NULL WHERE created_by IS NOT NULL;

-- Step 2: Clear user-specific data (loyalty, bookings, etc.)
DELETE FROM loyalty_entries;
DELETE FROM loyalty_cards;
DELETE FROM cinema_bookings;
DELETE FROM push_subscriptions;
DELETE FROM push_optin_events;
DELETE FROM notification_deliveries;
DELETE FROM events;
DELETE FROM notifications;
DELETE FROM page_views;
DELETE FROM user_interactions;
DELETE FROM user_journeys;
DELETE FROM user_sessions;
DELETE FROM pong_scores WHERE user_id IS NOT NULL;
DELETE FROM profiles;
DELETE FROM subscribers;
DELETE FROM webauthn_challenges;
DELETE FROM webauthn_credentials;
DELETE FROM membership_codes;
DELETE FROM membership_links;
DELETE FROM pending_banners;

-- Step 3: Delete all users from auth.users (now that all foreign keys are handled)
DELETE FROM auth.users;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Safe user data wipe completed. All users cleared, CMS content preserved.';
END $$;