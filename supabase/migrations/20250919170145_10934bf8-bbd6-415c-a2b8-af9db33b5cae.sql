-- Drop the duplicate advanced analytics function and keep the correct one
DROP FUNCTION IF EXISTS public.get_advanced_member_analytics_v2(
  date, date, integer, integer, text[], text, text[], text, 
  numeric, numeric, text[], text, text, text, text, text[], 
  text[], text, text, text, boolean, boolean, text, text
);

-- Also ensure the edge function calls the right RPC
-- Update the edge function to call the basic member analytics for now since it works