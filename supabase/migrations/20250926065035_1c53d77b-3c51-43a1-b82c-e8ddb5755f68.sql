-- Add max_capacity column to venues table
ALTER TABLE public.venues ADD COLUMN max_capacity INTEGER;

-- Add capacity_percentage column to walk_entries table
ALTER TABLE public.walk_entries ADD COLUMN capacity_percentage NUMERIC;

-- Create function to calculate capacity percentage
CREATE OR REPLACE FUNCTION public.calculate_capacity_percentage()
RETURNS TRIGGER AS $$
DECLARE
  venue_max_capacity INTEGER;
BEGIN
  -- Get the max capacity for the venue
  SELECT max_capacity INTO venue_max_capacity 
  FROM public.venues 
  WHERE id = NEW.venue_id;
  
  -- Calculate percentage if max capacity is set and greater than 0
  IF venue_max_capacity IS NOT NULL AND venue_max_capacity > 0 THEN
    NEW.capacity_percentage = ROUND((NEW.people_count::NUMERIC / venue_max_capacity::NUMERIC) * 100, 2);
  ELSE
    NEW.capacity_percentage = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate capacity percentage on insert/update
CREATE TRIGGER calculate_capacity_percentage_trigger
  BEFORE INSERT OR UPDATE ON public.walk_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_capacity_percentage();

-- Function to recalculate capacity percentages for existing data
CREATE OR REPLACE FUNCTION public.recalculate_all_capacity_percentages()
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
  updated_rows INTEGER := 0;
BEGIN
  -- Update all walk_entries with capacity calculations
  UPDATE public.walk_entries we
  SET capacity_percentage = CASE 
    WHEN v.max_capacity IS NOT NULL AND v.max_capacity > 0 
    THEN ROUND((we.people_count::NUMERIC / v.max_capacity::NUMERIC) * 100, 2)
    ELSE NULL
  END
  FROM public.venues v
  WHERE we.venue_id = v.id;
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  
  RETURN QUERY SELECT updated_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;