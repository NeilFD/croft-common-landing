DROP POLICY IF EXISTS "Members can view their own or approved moments" ON public.member_moments;

CREATE POLICY "Authenticated members can view visible moments"
ON public.member_moments
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR is_admin(auth.uid())
  OR COALESCE(is_visible, true) = true
);