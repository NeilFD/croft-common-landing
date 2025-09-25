-- Add visit_number to walk_entries to support multiple visits to the same venue
ALTER TABLE public.walk_entries ADD COLUMN visit_number integer NOT NULL DEFAULT 1;

-- Create a unique constraint on walk_card_id, venue_id, and visit_number
-- First drop the existing unique constraint if it exists
DO $$ 
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'walk_entries' 
        AND constraint_name = 'walk_entries_walk_card_id_venue_id_key'
    ) THEN
        ALTER TABLE public.walk_entries DROP CONSTRAINT walk_entries_walk_card_id_venue_id_key;
    END IF;
END $$;

-- Add new unique constraint including visit_number
ALTER TABLE public.walk_entries ADD CONSTRAINT walk_entries_walk_card_id_venue_id_visit_number_key 
UNIQUE (walk_card_id, venue_id, visit_number);

-- Create index for better performance on venue lookups
CREATE INDEX IF NOT EXISTS idx_walk_entries_venue_visits 
ON public.walk_entries (walk_card_id, venue_id, visit_number);