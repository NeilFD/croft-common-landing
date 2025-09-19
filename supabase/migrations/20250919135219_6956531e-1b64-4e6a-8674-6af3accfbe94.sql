-- Resolve function overloading ambiguity breaking analytics RPC
-- Drop the legacy signature of get_advanced_member_analytics so only the enhanced version remains
DROP FUNCTION IF EXISTS public.get_advanced_member_analytics(
  date, 
  date, 
  integer, 
  integer, 
  text[], 
  text, 
  text[], 
  text, 
  numeric, 
  numeric, 
  text[]
);
