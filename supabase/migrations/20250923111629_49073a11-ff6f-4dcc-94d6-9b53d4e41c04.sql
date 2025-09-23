-- Create venues table
CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  geo_area_id UUID NOT NULL,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create walk_cards table
CREATE TABLE public.walk_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time_block TEXT NOT NULL CHECK (time_block IN ('EarlyMorning', 'MidMorning', 'Lunch', 'MidAfternoon', 'EarlyEvening', 'Evening', 'Late')),
  weather_preset TEXT NOT NULL CHECK (weather_preset IN ('Sunny', 'Overcast', 'Rain', 'Mixed', 'ColdSnap', 'Heatwave')),
  weather_temp_c INTEGER,
  weather_notes TEXT,
  croft_zones TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Completed')),
  created_by_user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create walk_entries table
CREATE TABLE public.walk_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  walk_card_id UUID NOT NULL,
  venue_id UUID NOT NULL,
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

-- Create walk_card_geo_areas junction table for many-to-many relationship
CREATE TABLE public.walk_card_geo_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  walk_card_id UUID NOT NULL,
  geo_area_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(walk_card_id, geo_area_id)
);

-- Add foreign key constraints
ALTER TABLE public.venues ADD CONSTRAINT venues_geo_area_id_fkey 
  FOREIGN KEY (geo_area_id) REFERENCES public.geo_areas(id) ON DELETE CASCADE;

ALTER TABLE public.walk_entries ADD CONSTRAINT walk_entries_walk_card_id_fkey 
  FOREIGN KEY (walk_card_id) REFERENCES public.walk_cards(id) ON DELETE CASCADE;

ALTER TABLE public.walk_entries ADD CONSTRAINT walk_entries_venue_id_fkey 
  FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;

ALTER TABLE public.walk_card_geo_areas ADD CONSTRAINT walk_card_geo_areas_walk_card_id_fkey 
  FOREIGN KEY (walk_card_id) REFERENCES public.walk_cards(id) ON DELETE CASCADE;

ALTER TABLE public.walk_card_geo_areas ADD CONSTRAINT walk_card_geo_areas_geo_area_id_fkey 
  FOREIGN KEY (geo_area_id) REFERENCES public.geo_areas(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walk_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walk_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walk_card_geo_areas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for venues
CREATE POLICY "Research users can manage venues" ON public.venues
  FOR ALL USING (is_research_user())
  WITH CHECK (is_research_user());

-- Create RLS policies for walk_cards
CREATE POLICY "Research users can manage walk cards" ON public.walk_cards
  FOR ALL USING (is_research_user())
  WITH CHECK (is_research_user());

-- Create RLS policies for walk_entries
CREATE POLICY "Research users can manage walk entries" ON public.walk_entries
  FOR ALL USING (is_research_user())
  WITH CHECK (is_research_user());

-- Create RLS policies for walk_card_geo_areas
CREATE POLICY "Research users can manage walk card geo areas" ON public.walk_card_geo_areas
  FOR ALL USING (is_research_user())
  WITH CHECK (is_research_user());

-- Create triggers for updated_at timestamps
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