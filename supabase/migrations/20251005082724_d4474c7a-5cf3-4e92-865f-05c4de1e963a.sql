-- Add combinable_with to spaces table
ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS combinable_with uuid[];

-- Create space_combinations table
CREATE TABLE IF NOT EXISTS public.space_combinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  space_ids uuid[] NOT NULL,
  combined_capacity_seated integer NOT NULL,
  combined_capacity_standing integer NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  pricing_tier text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.space_combinations ENABLE ROW LEVEL SECURITY;

-- RLS policies for space_combinations
CREATE POLICY "Management users can view space combinations"
  ON public.space_combinations
  FOR SELECT
  USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'ops'::management_role) OR
    has_management_role(auth.uid(), 'finance'::management_role) OR
    has_management_role(auth.uid(), 'readonly'::management_role)
  );

CREATE POLICY "Admin/Sales can manage space combinations"
  ON public.space_combinations
  FOR ALL
  USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role)
  )
  WITH CHECK (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role)
  );

-- Public can view active space combinations
CREATE POLICY "Public can view active space combinations"
  ON public.space_combinations
  FOR SELECT
  USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_space_combinations_updated_at
  BEFORE UPDATE ON public.space_combinations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();