-- Drop the restrictive function with CASCADE to remove all dependent policies
DROP FUNCTION IF EXISTS public.is_research_user() CASCADE;

-- Create new open policies for any authenticated user
CREATE POLICY "Authenticated users can manage geo_areas" ON public.geo_areas 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage venues" ON public.venues 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage walk_cards" ON public.walk_cards 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage walk_entries" ON public.walk_entries 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage walk_card_geo_areas" ON public.walk_card_geo_areas 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);