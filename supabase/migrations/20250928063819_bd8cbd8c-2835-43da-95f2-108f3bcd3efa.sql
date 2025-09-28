-- Update bookings status check constraint to accept hold_soft instead of soft_hold
DO $$
BEGIN
    -- Drop the existing status check constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_status_check' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE public.bookings DROP CONSTRAINT bookings_status_check;
    END IF;
END $$;

-- Add the corrected constraint with hold_soft instead of soft_hold
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('draft', 'definite', 'hold', 'hold_soft', 'hold_firm', 'cancelled', 'completed', 'confirmed', 'tentative', 'pending'));