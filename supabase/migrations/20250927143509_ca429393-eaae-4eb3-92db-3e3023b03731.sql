-- Create bookings table for Phase 3: Calendar & Availability (Simplified)
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  start_ts timestamptz NOT NULL,
  end_ts timestamptz NOT NULL,
  setup_min int DEFAULT 0,
  teardown_min int DEFAULT 0,
  status text NOT NULL DEFAULT 'definite' CHECK (status IN ('definite')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on bookings table
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bookings
CREATE POLICY "All roles can view bookings" 
ON public.bookings 
FOR SELECT 
USING (true);

CREATE POLICY "Admin and sales can manage bookings" 
ON public.bookings 
FOR ALL 
USING (has_management_role(auth.uid(), 'admin'::management_role) OR has_management_role(auth.uid(), 'sales'::management_role))
WITH CHECK (has_management_role(auth.uid(), 'admin'::management_role) OR has_management_role(auth.uid(), 'sales'::management_role));

-- Add updated_at trigger
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();