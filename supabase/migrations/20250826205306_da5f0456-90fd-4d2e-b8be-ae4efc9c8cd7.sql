-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.is_within_venue_bounds(lat DECIMAL, lng DECIMAL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  venue_lat DECIMAL := 51.4583;
  venue_lng DECIMAL := -2.6014;
  max_distance_km DECIMAL := 0.2; -- 200 meter radius
  distance_km DECIMAL;
BEGIN
  -- Calculate approximate distance using Haversine formula (simplified)
  distance_km := SQRT(
    POWER(69.1 * (lat - venue_lat), 2) + 
    POWER(69.1 * (lng - venue_lng) * COS(venue_lat / 57.3), 2)
  ) * 1.609344; -- Convert miles to km
  
  RETURN distance_km <= max_distance_km;
END;
$$;