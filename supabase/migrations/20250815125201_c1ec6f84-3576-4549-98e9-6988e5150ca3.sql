-- Remove the problematic email verification logging that's causing foreign key constraint violations
DROP TRIGGER IF EXISTS email_verification_log_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.log_email_verification();