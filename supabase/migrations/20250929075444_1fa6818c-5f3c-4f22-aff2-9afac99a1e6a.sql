-- Enhanced BEO & Ops Handover System Database Schema - Fixed

-- MENUS & ALLERGENS
CREATE TABLE IF NOT EXISTS public.event_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  course text NOT NULL,                     -- e.g. Starters, Mains, Desserts, Drinks
  item_name text NOT NULL,
  description text,
  price numeric(10,2),
  notes text,
  allergens text[],                         -- array of allergen codes
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- STAFFING REQUIREMENTS
CREATE TABLE IF NOT EXISTS public.event_staffing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  role text NOT NULL,                       -- Manager, FOH, Bar, Kitchen, Security, Host
  qty integer NOT NULL DEFAULT 1,
  shift_start time,
  shift_end time,
  hourly_rate numeric(10,2),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- SCHEDULE / RUN SHEET
CREATE TABLE IF NOT EXISTS public.event_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  time_label text NOT NULL,                 -- e.g. Guest arrival, Dinner service, Music start
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer,
  responsible_role text,                    -- Which staff role is responsible
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ROOM LAYOUTS
CREATE TABLE IF NOT EXISTS public.event_room_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  space_name text NOT NULL,                 -- Hall, Hideout, Roof Terrace, etc.
  layout_type text NOT NULL,                -- Theatre, Boardroom, Cabaret, Reception, etc.
  capacity integer,
  setup_notes text,
  setup_time timestamptz,
  breakdown_time timestamptz,
  special_requirements text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- EQUIPMENT HIRE
CREATE TABLE IF NOT EXISTS public.event_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  category text NOT NULL,                   -- AV, Furniture, Technical, Catering, Security
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  specifications text,
  delivery_time timestamptz,
  collection_time timestamptz,
  hire_cost numeric(10,2),
  supplier text,
  contact_details text,
  setup_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- BEO VERSIONS (immutable once created)
CREATE TABLE IF NOT EXISTS public.event_beo_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  version_no integer NOT NULL,
  pdf_url text,                             -- stored PDF in Supabase Storage
  generated_by uuid REFERENCES auth.users(id),
  generated_at timestamptz DEFAULT now(),
  notes text,
  is_final boolean DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_menus_event_id ON public.event_menus(event_id);
CREATE INDEX IF NOT EXISTS idx_event_staffing_event_id ON public.event_staffing(event_id);
CREATE INDEX IF NOT EXISTS idx_event_schedule_event_id ON public.event_schedule(event_id);
CREATE INDEX IF NOT EXISTS idx_event_room_layouts_event_id ON public.event_room_layouts(event_id);
CREATE INDEX IF NOT EXISTS idx_event_equipment_event_id ON public.event_equipment(event_id);
CREATE INDEX IF NOT EXISTS idx_event_beo_versions_event_id ON public.event_beo_versions(event_id);

-- Create BEO storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('beo-documents', 'beo-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE public.event_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_staffing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_room_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_beo_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_menus
CREATE POLICY "Management users can view event menus" ON public.event_menus
FOR SELECT USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role) OR
  has_management_role(auth.uid(), 'finance'::management_role) OR
  has_management_role(auth.uid(), 'readonly'::management_role)
);

CREATE POLICY "Admin/Sales/Ops can manage event menus" ON public.event_menus
FOR ALL USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role)
)
WITH CHECK (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role)
);

-- RLS Policies for event_staffing
CREATE POLICY "Management users can view event staffing" ON public.event_staffing
FOR SELECT USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role) OR
  has_management_role(auth.uid(), 'finance'::management_role) OR
  has_management_role(auth.uid(), 'readonly'::management_role)
);

CREATE POLICY "Admin/Sales/Ops can manage event staffing" ON public.event_staffing
FOR ALL USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role)
)
WITH CHECK (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role)
);

-- RLS Policies for event_schedule
CREATE POLICY "Management users can view event schedule" ON public.event_schedule
FOR SELECT USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role) OR
  has_management_role(auth.uid(), 'finance'::management_role) OR
  has_management_role(auth.uid(), 'readonly'::management_role)
);

CREATE POLICY "Admin/Sales/Ops can manage event schedule" ON public.event_schedule
FOR ALL USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role)
)
WITH CHECK (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role)
);

-- RLS Policies for event_room_layouts
CREATE POLICY "Management users can view event room layouts" ON public.event_room_layouts
FOR SELECT USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role) OR
  has_management_role(auth.uid(), 'finance'::management_role) OR
  has_management_role(auth.uid(), 'readonly'::management_role)
);

CREATE POLICY "Admin/Sales/Ops can manage event room layouts" ON public.event_room_layouts
FOR ALL USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role)
)
WITH CHECK (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role)
);

-- RLS Policies for event_equipment
CREATE POLICY "Management users can view event equipment" ON public.event_equipment
FOR SELECT USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role) OR
  has_management_role(auth.uid(), 'finance'::management_role) OR
  has_management_role(auth.uid(), 'readonly'::management_role)
);

CREATE POLICY "Admin/Sales/Ops can manage event equipment" ON public.event_equipment
FOR ALL USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role)
)
WITH CHECK (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role)
);

-- RLS Policies for event_beo_versions (read-only after creation)
CREATE POLICY "Management users can view BEO versions" ON public.event_beo_versions
FOR SELECT USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role) OR
  has_management_role(auth.uid(), 'finance'::management_role) OR
  has_management_role(auth.uid(), 'readonly'::management_role)
);

CREATE POLICY "Admin/Sales/Ops can create BEO versions" ON public.event_beo_versions
FOR INSERT WITH CHECK (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role)
);

-- BEO Storage policies
CREATE POLICY "Management users can view BEO documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'beo-documents' AND (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'ops'::management_role) OR
    has_management_role(auth.uid(), 'finance'::management_role) OR
    has_management_role(auth.uid(), 'readonly'::management_role)
  )
);

CREATE POLICY "Admin/Sales/Ops can upload BEO documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'beo-documents' AND (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'ops'::management_role)
  )
);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_beo_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_menus_updated_at
  BEFORE UPDATE ON public.event_menus
  FOR EACH ROW EXECUTE FUNCTION public.update_beo_updated_at_column();

CREATE TRIGGER update_event_staffing_updated_at
  BEFORE UPDATE ON public.event_staffing
  FOR EACH ROW EXECUTE FUNCTION public.update_beo_updated_at_column();

CREATE TRIGGER update_event_schedule_updated_at
  BEFORE UPDATE ON public.event_schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_beo_updated_at_column();

CREATE TRIGGER update_event_room_layouts_updated_at
  BEFORE UPDATE ON public.event_room_layouts
  FOR EACH ROW EXECUTE FUNCTION public.update_beo_updated_at_column();

CREATE TRIGGER update_event_equipment_updated_at
  BEFORE UPDATE ON public.event_equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_beo_updated_at_column();