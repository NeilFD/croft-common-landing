-- Fix incorrect foreign key on client_access.event_id pointing to public.events
-- Change it to reference public.management_events(id)

ALTER TABLE public.client_access
  DROP CONSTRAINT IF EXISTS client_access_event_id_fkey;

ALTER TABLE public.client_access
  ADD CONSTRAINT client_access_event_id_fkey
  FOREIGN KEY (event_id)
  REFERENCES public.management_events(id)
  ON DELETE CASCADE;