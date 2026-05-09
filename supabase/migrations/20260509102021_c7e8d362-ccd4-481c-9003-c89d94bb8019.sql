
-- Properties
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  location text,
  positioning text,
  signature_feel text,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "properties readable" ON public.properties FOR SELECT USING (true);
CREATE POLICY "properties writable by auth" ON public.properties FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Extend spaces
ALTER TABLE public.spaces
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS capacity_seated int,
  ADD COLUMN IF NOT EXISTS capacity_standing int,
  ADD COLUMN IF NOT EXISTS capacity_dining int,
  ADD COLUMN IF NOT EXISTS min_guests int,
  ADD COLUMN IF NOT EXISTS max_guests int,
  ADD COLUMN IF NOT EXISTS layouts text[],
  ADD COLUMN IF NOT EXISTS indoor_outdoor text,
  ADD COLUMN IF NOT EXISTS step_free boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS av_included boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS music_curfew text,
  ADD COLUMN IF NOT EXISTS event_types text[],
  ADD COLUMN IF NOT EXISTS combinable_with text[],
  ADD COLUMN IF NOT EXISTS hire_notes text,
  ADD COLUMN IF NOT EXISTS min_spend_notes text,
  ADD COLUMN IF NOT EXISTS exclusivity_notes text,
  ADD COLUMN IF NOT EXISTS tone_blurb text,
  ADD COLUMN IF NOT EXISTS display_order int DEFAULT 0;

ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spaces readable" ON public.spaces;
DROP POLICY IF EXISTS "spaces writable by auth" ON public.spaces;
CREATE POLICY "spaces readable" ON public.spaces FOR SELECT USING (true);
CREATE POLICY "spaces writable by auth" ON public.spaces FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Bedrooms
CREATE TABLE IF NOT EXISTS public.bedrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tier text NOT NULL,
  count int NOT NULL DEFAULT 0,
  max_occupancy int,
  notes text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.bedrooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bedrooms readable" ON public.bedrooms FOR SELECT USING (true);
CREATE POLICY "bedrooms writable by auth" ON public.bedrooms FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- F&B venues
CREATE TABLE IF NOT EXISTS public.fb_venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  formats text[],
  capacity int,
  tone_blurb text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (property_id, slug)
);
ALTER TABLE public.fb_venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fb_venues readable" ON public.fb_venues FOR SELECT USING (true);
CREATE POLICY "fb_venues writable by auth" ON public.fb_venues FOR ALL TO authenticated USING (true) WITH CHECK (true);
