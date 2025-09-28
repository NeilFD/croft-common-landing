-- Add existing_rank column to conflicts table for conflict prioritization
ALTER TABLE public.conflicts ADD COLUMN existing_rank integer DEFAULT 0;

-- Add existing_rank column to bookings table for booking prioritization  
ALTER TABLE public.bookings ADD COLUMN existing_rank integer DEFAULT 0;

-- Create index on existing_rank for better query performance
CREATE INDEX idx_conflicts_existing_rank ON public.conflicts(existing_rank);
CREATE INDEX idx_bookings_existing_rank ON public.bookings(existing_rank);

-- Create function to calculate booking rank based on status and date
CREATE OR REPLACE FUNCTION public.calculate_booking_rank(
  p_status text,
  p_created_at timestamp with time zone,
  p_start_ts timestamp with time zone
)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = 'public'
AS $$
BEGIN
  -- Priority ranking system:
  -- Definite bookings = 1000 + days until event
  -- Hold bookings = 500 + days until event  
  -- Draft/other = 100 + days until event
  
  CASE p_status
    WHEN 'definite' THEN
      RETURN 1000 + EXTRACT(DAYS FROM p_start_ts - NOW())::integer;
    WHEN 'hold' THEN
      RETURN 500 + EXTRACT(DAYS FROM p_start_ts - NOW())::integer;
    ELSE
      RETURN 100 + EXTRACT(DAYS FROM p_start_ts - NOW())::integer;
  END CASE;
END;
$$;

-- Update existing bookings with calculated ranks
UPDATE public.bookings 
SET existing_rank = public.calculate_booking_rank(status, created_at, start_ts)
WHERE existing_rank = 0;