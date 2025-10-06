-- Phase 6: Client Portal - Magic Link + Persistent Sessions

-- ============================================================================
-- TABLES
-- ============================================================================

-- Client access tokens (magic links)
CREATE TABLE IF NOT EXISTS public.client_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  event_code TEXT NOT NULL UNIQUE,
  magic_token_hash TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  revoked BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_client_access_event_id ON public.client_access(event_id);
CREATE INDEX idx_client_access_event_code ON public.client_access(event_code);
CREATE INDEX idx_client_access_expires_at ON public.client_access(token_expires_at);

-- Client session context (stores active session context)
CREATE TABLE IF NOT EXISTS public.client_session_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  user_agent TEXT,
  ip_hash TEXT,
  session_fingerprint TEXT,
  csrf_token TEXT NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  revoked BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_client_session_event_id ON public.client_session_context(event_id);
CREATE INDEX idx_client_session_expires_at ON public.client_session_context(expires_at);
CREATE INDEX idx_client_session_revoked ON public.client_session_context(revoked) WHERE NOT revoked;

-- Client messages (two-way chat)
CREATE TABLE IF NOT EXISTS public.client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  author TEXT NOT NULL CHECK (author IN ('client', 'team')),
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_client_messages_event_id ON public.client_messages(event_id);
CREATE INDEX idx_client_messages_created_at ON public.client_messages(created_at DESC);

-- Client files
CREATE TABLE IF NOT EXISTS public.client_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_client_files_event_id ON public.client_files(event_id);
CREATE INDEX idx_client_files_created_at ON public.client_files(created_at DESC);

-- ============================================================================
-- SESSION CONTEXT HELPER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_client_event_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT event_id
  FROM public.client_session_context
  WHERE id = current_setting('app.client_session_id', true)::UUID
    AND NOT revoked
    AND expires_at > NOW()
  LIMIT 1;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.client_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_session_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;

-- client_access policies
CREATE POLICY "System can manage client access"
  ON public.client_access FOR ALL
  USING (true) WITH CHECK (true);

-- client_session_context policies
CREATE POLICY "System can manage client sessions"
  ON public.client_session_context FOR ALL
  USING (true) WITH CHECK (true);

-- client_messages policies
CREATE POLICY "Clients can view messages for their event"
  ON public.client_messages FOR SELECT
  USING (event_id = public.get_client_event_id());

CREATE POLICY "Clients can post messages for their event"
  ON public.client_messages FOR INSERT
  WITH CHECK (event_id = public.get_client_event_id() AND author = 'client');

CREATE POLICY "Management can view all client messages"
  ON public.client_messages FOR SELECT
  USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'ops'::management_role)
  );

CREATE POLICY "Management can post team messages"
  ON public.client_messages FOR INSERT
  WITH CHECK (
    (has_management_role(auth.uid(), 'admin'::management_role) OR
     has_management_role(auth.uid(), 'sales'::management_role) OR
     has_management_role(auth.uid(), 'ops'::management_role))
    AND author = 'team'
  );

CREATE POLICY "Management can update messages"
  ON public.client_messages FOR UPDATE
  USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role)
  );

-- client_files policies
CREATE POLICY "Clients can view files for their event"
  ON public.client_files FOR SELECT
  USING (event_id = public.get_client_event_id());

CREATE POLICY "Clients can upload files for their event"
  ON public.client_files FOR INSERT
  WITH CHECK (event_id = public.get_client_event_id());

CREATE POLICY "Management can view all client files"
  ON public.client_files FOR SELECT
  USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'ops'::management_role)
  );

CREATE POLICY "Management can delete client files"
  ON public.client_files FOR DELETE
  USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role)
  );

-- Add client access to events
CREATE POLICY "Clients can view their event"
  ON public.events FOR SELECT
  USING (id = public.get_client_event_id());

-- Add client access to invoices
CREATE POLICY "Clients can view their event invoices"
  ON public.invoices FOR SELECT
  USING (event_id = public.get_client_event_id());

-- ============================================================================
-- STORAGE BUCKET & POLICIES
-- ============================================================================

-- Create client-files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-files', 'client-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for client-files bucket
CREATE POLICY "Clients can upload files to their event folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'client-files' AND
    (storage.foldername(name))[1] = public.get_client_event_id()::text
  );

CREATE POLICY "Clients can view files in their event folder"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'client-files' AND
    (storage.foldername(name))[1] = public.get_client_event_id()::text
  );

CREATE POLICY "Management can view all client files in storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'client-files' AND
    (has_management_role(auth.uid(), 'admin'::management_role) OR
     has_management_role(auth.uid(), 'sales'::management_role) OR
     has_management_role(auth.uid(), 'ops'::management_role))
  );

CREATE POLICY "Management can delete client files in storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'client-files' AND
    (has_management_role(auth.uid(), 'admin'::management_role) OR
     has_management_role(auth.uid(), 'sales'::management_role))
  );