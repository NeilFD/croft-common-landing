-- Make research tables fully public (anon) for all write operations

-- Geo areas
DROP POLICY IF EXISTS "Public can manage geo_areas" ON public.geo_areas;
CREATE POLICY "Public can manage geo_areas" ON public.geo_areas
FOR ALL TO public
USING (true)
WITH CHECK (true);

-- Venues
DROP POLICY IF EXISTS "Public can manage venues" ON public.venues;
CREATE POLICY "Public can manage venues" ON public.venues
FOR ALL TO public
USING (true)
WITH CHECK (true);

-- Walk cards
DROP POLICY IF EXISTS "Public can manage walk_cards" ON public.walk_cards;
CREATE POLICY "Public can manage walk_cards" ON public.walk_cards
FOR ALL TO public
USING (true)
WITH CHECK (true);

-- Walk entries
DROP POLICY IF EXISTS "Public can manage walk_entries" ON public.walk_entries;
CREATE POLICY "Public can manage walk_entries" ON public.walk_entries
FOR ALL TO public
USING (true)
WITH CHECK (true);

-- Walk card geo areas
DROP POLICY IF EXISTS "Public can manage walk_card_geo_areas" ON public.walk_card_geo_areas;
CREATE POLICY "Public can manage walk_card_geo_areas" ON public.walk_card_geo_areas
FOR ALL TO public
USING (true)
WITH CHECK (true);