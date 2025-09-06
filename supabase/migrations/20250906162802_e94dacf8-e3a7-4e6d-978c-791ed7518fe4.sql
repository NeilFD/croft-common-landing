-- Fix the get_representative_item_name function
CREATE OR REPLACE FUNCTION public.get_representative_item_name(names text[])
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  result text;
BEGIN
  -- Get the most frequent name, preferring proper case over all caps
  SELECT item_name INTO result
  FROM (
    SELECT 
      item_name,
      COUNT(*) as frequency,
      -- Prefer mixed case over all caps, then by frequency
      CASE 
        WHEN item_name ~ '[a-z]' THEN 2  -- Has lowercase letters
        WHEN item_name ~ '^[A-Z\s&]+$' THEN 1  -- All caps
        ELSE 0
      END as case_preference
    FROM unnest(names) as item_name
    GROUP BY item_name
    ORDER BY frequency DESC, case_preference DESC, item_name
    LIMIT 1
  ) ranked;
  
  RETURN COALESCE(result, names[1]);
END;
$$;