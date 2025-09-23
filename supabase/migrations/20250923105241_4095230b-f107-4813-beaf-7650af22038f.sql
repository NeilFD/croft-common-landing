-- Create enums for the research module
CREATE TYPE time_block_enum AS ENUM (
  'EarlyMorning',
  'MidMorning', 
  'Lunch',
  'MidAfternoon',
  'EarlyEvening',
  'Evening',
  'Late'
);

CREATE TYPE weather_preset_enum AS ENUM (
  'Sunny',
  'Overcast',
  'Rain',
  'Mixed',
  'ColdSnap',
  'Heatwave'
);

CREATE TYPE walk_card_status_enum AS ENUM (
  'Draft',
  'Active',
  'Completed'
);

-- Create geo_areas table
CREATE TABLE public.geo_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create venues table
CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  geo_area_id UUID NOT NULL REFERENCES public.geo_areas(id) ON DELETE CASCADE,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, geo_area_id)
);

-- Create walk_cards table
CREATE TABLE public.walk_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time_block time_block_enum NOT NULL,
  weather_preset weather_preset_enum NOT NULL,
  weather_temp_c INTEGER,
  weather_notes TEXT,
  croft_zones TEXT[] NOT NULL DEFAULT '{}',
  created_by_user_id UUID NOT NULL,
  status walk_card_status_enum NOT NULL DEFAULT 'Draft',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create walk_card_geo_areas join table
CREATE TABLE public.walk_card_geo_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  walk_card_id UUID NOT NULL REFERENCES public.walk_cards(id) ON DELETE CASCADE,
  geo_area_id UUID NOT NULL REFERENCES public.geo_areas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(walk_card_id, geo_area_id)
);

-- Create walk_entries table
CREATE TABLE public.walk_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  walk_card_id UUID NOT NULL REFERENCES public.walk_cards(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  people_count INTEGER NOT NULL DEFAULT 0,
  laptop_count INTEGER NOT NULL DEFAULT 0,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  photo_url TEXT,
  flag_anomaly BOOLEAN NOT NULL DEFAULT false,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(walk_card_id, venue_id)
);

-- Create pnls table (placeholder for future)
CREATE TABLE public.pnls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  effective_from DATE NOT NULL,
  json_forecast JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.geo_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walk_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walk_card_geo_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walk_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pnls ENABLE ROW LEVEL SECURITY;

-- Create function to check research access
CREATE OR REPLACE FUNCTION public.is_research_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get current user email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  -- Check if user email is in research allowlist
  RETURN user_email IN ('neil@cityandsanctuary.com', 'andrew.brown@portlandbrown.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create RLS policies for geo_areas
CREATE POLICY "Research users can manage geo_areas" ON public.geo_areas
FOR ALL TO authenticated
USING (public.is_research_user())
WITH CHECK (public.is_research_user());

-- Create RLS policies for venues
CREATE POLICY "Research users can manage venues" ON public.venues
FOR ALL TO authenticated
USING (public.is_research_user())
WITH CHECK (public.is_research_user());

-- Create RLS policies for walk_cards
CREATE POLICY "Research users can manage walk_cards" ON public.walk_cards
FOR ALL TO authenticated
USING (public.is_research_user())
WITH CHECK (public.is_research_user());

-- Create RLS policies for walk_card_geo_areas
CREATE POLICY "Research users can manage walk_card_geo_areas" ON public.walk_card_geo_areas
FOR ALL TO authenticated
USING (public.is_research_user())
WITH CHECK (public.is_research_user());

-- Create RLS policies for walk_entries
CREATE POLICY "Research users can manage walk_entries" ON public.walk_entries
FOR ALL TO authenticated
USING (public.is_research_user())
WITH CHECK (public.is_research_user());

-- Create RLS policies for pnls
CREATE POLICY "Research users can manage pnls" ON public.pnls
FOR ALL TO authenticated
USING (public.is_research_user())
WITH CHECK (public.is_research_user());

-- Create indexes for performance
CREATE INDEX idx_venues_geo_area_id ON public.venues(geo_area_id);
CREATE INDEX idx_walk_cards_created_by ON public.walk_cards(created_by_user_id);
CREATE INDEX idx_walk_cards_status ON public.walk_cards(status);
CREATE INDEX idx_walk_cards_date ON public.walk_cards(date);
CREATE INDEX idx_walk_entries_walk_card_id ON public.walk_entries(walk_card_id);
CREATE INDEX idx_walk_entries_venue_id ON public.walk_entries(venue_id);

-- Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_geo_areas_updated_at
  BEFORE UPDATE ON public.geo_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_walk_cards_updated_at
  BEFORE UPDATE ON public.walk_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_walk_entries_updated_at
  BEFORE UPDATE ON public.walk_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pnls_updated_at
  BEFORE UPDATE ON public.pnls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed data for Bristol research areas
INSERT INTO public.geo_areas (name) VALUES
  ('Old City'),
  ('Harbourside'),
  ('Park Street'),
  ('Clifton Triangle'),
  ('Stokes Croft');

-- Insert seed venues for each geo area
WITH geo_area_data AS (
  SELECT id, name FROM public.geo_areas WHERE name IN ('Old City', 'Harbourside', 'Park Street', 'Clifton Triangle', 'Stokes Croft')
)
INSERT INTO public.venues (name, geo_area_id) 
SELECT venue_name, geo_id FROM (
  VALUES 
    ('The Old Duke', (SELECT id FROM geo_area_data WHERE name = 'Old City')),
    ('Llandoger Trow', (SELECT id FROM geo_area_data WHERE name = 'Old City')),
    ('The Hatchet Inn', (SELECT id FROM geo_area_data WHERE name = 'Old City')),
    
    ('Watershed Cafe', (SELECT id FROM geo_area_data WHERE name = 'Harbourside')),
    ('Grain Barge', (SELECT id FROM geo_area_data WHERE name = 'Harbourside')),
    ('The Glassboat', (SELECT id FROM geo_area_data WHERE name = 'Harbourside')),
    
    ('Boston Tea Party Park Street', (SELECT id FROM geo_area_data WHERE name = 'Park Street')),
    ('The Berkeley', (SELECT id FROM geo_area_data WHERE name = 'Park Street')),
    ('Cafe Nero Park Street', (SELECT id FROM geo_area_data WHERE name = 'Park Street')),
    
    ('The Clifton Sausage', (SELECT id FROM geo_area_data WHERE name = 'Clifton Triangle')),
    ('Goldbrick House', (SELECT id FROM geo_area_data WHERE name = 'Clifton Triangle')),
    ('The Ivy Clifton Brasserie', (SELECT id FROM geo_area_data WHERE name = 'Clifton Triangle')),
    
    ('Full Court Press', (SELECT id FROM geo_area_data WHERE name = 'Stokes Croft')),
    ('The Canteen', (SELECT id FROM geo_area_data WHERE name = 'Stokes Croft')),
    ('Pieminister Stokes Croft', (SELECT id FROM geo_area_data WHERE name = 'Stokes Croft'))
) AS venue_data(venue_name, geo_id);