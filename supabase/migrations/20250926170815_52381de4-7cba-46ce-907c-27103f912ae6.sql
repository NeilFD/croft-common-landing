-- Fix: use correct pg_policies column name (policyname)
-- Public read-only access for research tables to prevent empty /research loads

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.geo_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.walk_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.walk_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.walk_card_geo_areas ENABLE ROW LEVEL SECURITY;

-- geo_areas
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'geo_areas' AND policyname = 'Public can view active geo areas'
  ) THEN
    CREATE POLICY "Public can view active geo areas"
    ON public.geo_areas
    FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

-- venues
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'venues' AND policyname = 'Public can view active venues'
  ) THEN
    CREATE POLICY "Public can view active venues"
    ON public.venues
    FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

-- walk_cards
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'walk_cards' AND policyname = 'Public can view walk cards'
  ) THEN
    CREATE POLICY "Public can view walk cards"
    ON public.walk_cards
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- walk_entries
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'walk_entries' AND policyname = 'Public can view walk entries'
  ) THEN
    CREATE POLICY "Public can view walk entries"
    ON public.walk_entries
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- walk_card_geo_areas
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'walk_card_geo_areas' AND policyname = 'Public can view walk card geo areas'
  ) THEN
    CREATE POLICY "Public can view walk card geo areas"
    ON public.walk_card_geo_areas
    FOR SELECT
    USING (true);
  END IF;
END $$;
