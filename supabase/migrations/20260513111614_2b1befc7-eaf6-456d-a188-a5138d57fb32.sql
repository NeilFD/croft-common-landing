
-- 1) Fix RLS issue: make status-log trigger SECURITY DEFINER so it can insert
--    on behalf of any authenticated editor. Also extend authorisation rules
--    to allow approved/rejected/changes_requested transitions only by
--    hardcoded marketing authorisers.

CREATE OR REPLACE FUNCTION public.is_marketing_authoriser(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = _uid
      AND lower(u.email) IN (
        'jen.needham@crazybear.co.uk',
        'neil.fincham-dukes@crazybear.co.uk'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.log_marketing_post_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Only marketing authorisers can move into approved / rejected /
    -- changes_requested. Anyone with edit rights can move into in_review.
    IF NEW.status IN ('approved', 'rejected', 'changes_requested')
       AND NOT public.is_marketing_authoriser(auth.uid()) THEN
      RAISE EXCEPTION 'Only Jen Needham or Neil Fincham-Dukes can approve, reject, or request changes';
    END IF;

    INSERT INTO public.marketing_status_log(post_id, from_status, to_status, author_id)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Allow inserts via SECURITY DEFINER trigger; also add a permissive insert
-- policy for completeness so authenticated management users can write notes.
DROP POLICY IF EXISTS "mkt_status_log_insert" ON public.marketing_status_log;
CREATE POLICY "mkt_status_log_insert"
ON public.marketing_status_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_management_user(auth.uid()));
