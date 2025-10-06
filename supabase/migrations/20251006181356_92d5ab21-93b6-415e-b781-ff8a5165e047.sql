-- Align client portal tables to management_events

ALTER TABLE public.client_session_context
  DROP CONSTRAINT IF EXISTS client_session_context_event_id_fkey;

ALTER TABLE public.client_session_context
  ADD CONSTRAINT client_session_context_event_id_fkey
  FOREIGN KEY (event_id)
  REFERENCES public.management_events(id)
  ON DELETE CASCADE;

ALTER TABLE public.client_messages
  DROP CONSTRAINT IF EXISTS client_messages_event_id_fkey;

ALTER TABLE public.client_messages
  ADD CONSTRAINT client_messages_event_id_fkey
  FOREIGN KEY (event_id)
  REFERENCES public.management_events(id)
  ON DELETE CASCADE;