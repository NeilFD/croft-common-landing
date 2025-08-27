-- Re-enable service role policies for all streak tables to allow the function to manage any records

-- Service role policies for streak_weeks
CREATE POLICY "Service role can manage all streak weeks"
ON public.streak_weeks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role policies for streak_sets
CREATE POLICY "Service role can manage all streak sets"
ON public.streak_sets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role policies for streak_badges
CREATE POLICY "Service role can manage all streak badges"
ON public.streak_badges
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role policies for streak_rewards
CREATE POLICY "Service role can manage all streak rewards"
ON public.streak_rewards
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role policies for streak_grace_periods
CREATE POLICY "Service role can manage all streak grace periods"
ON public.streak_grace_periods
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role policies for member_streaks
CREATE POLICY "Service role can manage all member streaks"
ON public.member_streaks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);