-- First, let's see the current constraint and drop it
DO $$
BEGIN
    -- Drop the existing status check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_status_check' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE public.bookings DROP CONSTRAINT bookings_status_check;
    END IF;
END $$;

-- Add a new check constraint that includes all necessary status values
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('draft', 'definite', 'hold', 'soft_hold', 'hard_hold', 'cancelled', 'completed', 'confirmed', 'tentative', 'pending'));

-- Also ensure we have the necessary hold types as an enum if needed
DO $$
BEGIN
    -- Create hold_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hold_type') THEN
        CREATE TYPE public.hold_type AS ENUM ('soft_hold', 'hard_hold', 'option', 'tentative');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Type already exists, do nothing
        NULL;
END $$;

-- Add hold_type column to bookings if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'hold_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN hold_type public.hold_type;
    END IF;
END $$;