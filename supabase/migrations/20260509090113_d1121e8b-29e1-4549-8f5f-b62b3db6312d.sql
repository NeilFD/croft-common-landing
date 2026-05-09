-- Allow members to create/update their own extended profile row (needed for upsert)
CREATE POLICY "Users can insert their own extended profile"
  ON public.member_profiles_extended
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Tighten the existing UPDATE policy with WITH CHECK so id swaps are blocked
DROP POLICY IF EXISTS "Users can update their own extended profile" ON public.member_profiles_extended;
CREATE POLICY "Users can update their own extended profile"
  ON public.member_profiles_extended
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);