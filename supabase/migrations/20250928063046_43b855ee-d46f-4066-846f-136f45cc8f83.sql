-- Create conflicts table for tracking scheduling conflicts
CREATE TABLE public.conflicts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id_1 uuid NOT NULL,
  booking_id_2 uuid NOT NULL,
  conflict_type text NOT NULL DEFAULT 'scheduling',
  conflict_details jsonb DEFAULT '{}',
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved_by uuid,
  CONSTRAINT conflicts_different_bookings CHECK (booking_id_1 != booking_id_2)
);

-- Enable RLS
ALTER TABLE public.conflicts ENABLE ROW LEVEL SECURITY;

-- Create policies for conflicts table
CREATE POLICY "Management users can view conflicts" 
ON public.conflicts 
FOR SELECT 
USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR 
  has_management_role(auth.uid(), 'sales'::management_role) OR 
  has_management_role(auth.uid(), 'ops'::management_role) OR 
  has_management_role(auth.uid(), 'finance'::management_role) OR 
  has_management_role(auth.uid(), 'readonly'::management_role)
);

CREATE POLICY "Management users can create conflicts" 
ON public.conflicts 
FOR INSERT 
WITH CHECK (
  has_management_role(auth.uid(), 'admin'::management_role) OR 
  has_management_role(auth.uid(), 'sales'::management_role) OR 
  has_management_role(auth.uid(), 'ops'::management_role)
);

CREATE POLICY "Management users can update conflicts" 
ON public.conflicts 
FOR UPDATE 
USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR 
  has_management_role(auth.uid(), 'sales'::management_role) OR 
  has_management_role(auth.uid(), 'ops'::management_role)
)
WITH CHECK (
  has_management_role(auth.uid(), 'admin'::management_role) OR 
  has_management_role(auth.uid(), 'sales'::management_role) OR 
  has_management_role(auth.uid(), 'ops'::management_role)
);

CREATE POLICY "Admins can delete conflicts" 
ON public.conflicts 
FOR DELETE 
USING (has_management_role(auth.uid(), 'admin'::management_role));

-- Add updated_at trigger
CREATE TRIGGER update_conflicts_updated_at
BEFORE UPDATE ON public.conflicts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to detect booking conflicts
CREATE OR REPLACE FUNCTION public.detect_booking_conflicts(
  p_space_id uuid,
  p_start_ts timestamp with time zone,
  p_end_ts timestamp with time zone,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS TABLE(
  conflicting_booking_id uuid,
  conflicting_title text,
  conflicting_start timestamp with time zone,
  conflicting_end timestamp with time zone,
  conflict_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as conflicting_booking_id,
    b.title as conflicting_title,
    b.start_ts as conflicting_start,
    b.end_ts as conflicting_end,
    'time_overlap'::text as conflict_type
  FROM public.bookings b
  WHERE b.space_id = p_space_id
    AND b.status != 'cancelled'
    AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id)
    AND (
      -- Check for time overlap
      (b.start_ts <= p_end_ts AND b.end_ts >= p_start_ts)
    );
END;
$$;