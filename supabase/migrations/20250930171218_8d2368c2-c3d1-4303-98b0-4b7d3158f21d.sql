-- Common Knowledge Module Schema

-- Create enums
CREATE TYPE ck_doc_type AS ENUM (
  'ethos',
  'sop',
  'standard',
  'policy',
  'training',
  'menu',
  'legal',
  'finance',
  'marketing',
  'licence',
  'briefing'
);

CREATE TYPE ck_doc_status AS ENUM (
  'draft',
  'in_review',
  'approved'
);

CREATE TYPE ck_share_level AS ENUM (
  'view',
  'comment',
  'edit',
  'manage'
);

CREATE TYPE ck_grantee_type AS ENUM (
  'role',
  'user',
  'link'
);

-- Collections table
CREATE TABLE public.ck_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.ck_collections(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents table
CREATE TABLE public.ck_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.ck_collections(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type ck_doc_type NOT NULL,
  status ck_doc_status NOT NULL DEFAULT 'draft',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  zones TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  version_current_id UUID,
  ack_required BOOLEAN DEFAULT false,
  ack_due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document versions table
CREATE TABLE public.ck_doc_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES public.ck_docs(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL,
  editor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  summary TEXT,
  content_md TEXT NOT NULL,
  content_html TEXT,
  search_text TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(doc_id, version_no)
);

-- Files table
CREATE TABLE public.ck_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES public.ck_docs(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.ck_doc_versions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  size BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shares table
CREATE TABLE public.ck_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES public.ck_docs(id) ON DELETE CASCADE,
  level ck_share_level NOT NULL,
  grantee_type ck_grantee_type NOT NULL,
  grantee_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Read receipts table
CREATE TABLE public.ck_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES public.ck_docs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.ck_doc_versions(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged BOOLEAN DEFAULT false,
  UNIQUE(doc_id, user_id, version_id)
);

-- Comments table
CREATE TABLE public.ck_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES public.ck_docs(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.ck_doc_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selection_anchor TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Pins table
CREATE TABLE public.ck_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_id UUID NOT NULL REFERENCES public.ck_docs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, doc_id)
);

-- Audit table
CREATE TABLE public.ck_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  doc_id UUID REFERENCES public.ck_docs(id) ON DELETE CASCADE,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key for current version
ALTER TABLE public.ck_docs 
ADD CONSTRAINT fk_current_version 
FOREIGN KEY (version_current_id) 
REFERENCES public.ck_doc_versions(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX idx_ck_docs_collection ON public.ck_docs(collection_id);
CREATE INDEX idx_ck_docs_slug ON public.ck_docs(slug);
CREATE INDEX idx_ck_docs_status ON public.ck_docs(status);
CREATE INDEX idx_ck_doc_versions_doc ON public.ck_doc_versions(doc_id);
CREATE INDEX idx_ck_doc_versions_search ON public.ck_doc_versions USING gin(search_text);
CREATE INDEX idx_ck_shares_doc ON public.ck_shares(doc_id);
CREATE INDEX idx_ck_shares_grantee ON public.ck_shares(grantee_type, grantee_id);
CREATE INDEX idx_ck_read_receipts_user_doc ON public.ck_read_receipts(user_id, doc_id);
CREATE INDEX idx_ck_comments_doc ON public.ck_comments(doc_id);
CREATE INDEX idx_ck_pins_user ON public.ck_pins(user_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('common-knowledge', 'common-knowledge', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE public.ck_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ck_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ck_doc_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ck_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ck_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ck_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ck_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ck_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ck_audit ENABLE ROW LEVEL SECURITY;

-- Helper function to check document access
CREATE OR REPLACE FUNCTION public.ck_has_doc_access(
  _doc_id UUID,
  _user_id UUID,
  _min_level ck_share_level DEFAULT 'view'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  doc_status ck_doc_status;
  has_share BOOLEAN;
BEGIN
  -- Get user's management role
  SELECT role::TEXT INTO user_role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  -- Get document status
  SELECT status INTO doc_status
  FROM public.ck_docs
  WHERE id = _doc_id;
  
  -- Admin always has access
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Check if user has explicit share
  SELECT EXISTS (
    SELECT 1 FROM public.ck_shares
    WHERE doc_id = _doc_id
    AND (
      (grantee_type = 'user' AND grantee_id = _user_id::TEXT)
      OR (grantee_type = 'role' AND grantee_id = user_role)
    )
    AND (expires_at IS NULL OR expires_at > now())
    AND CASE _min_level
      WHEN 'view' THEN level IN ('view', 'comment', 'edit', 'manage')
      WHEN 'comment' THEN level IN ('comment', 'edit', 'manage')
      WHEN 'edit' THEN level IN ('edit', 'manage')
      WHEN 'manage' THEN level = 'manage'
    END
  ) INTO has_share;
  
  -- If has explicit share, grant access
  IF has_share THEN
    RETURN true;
  END IF;
  
  -- If doc is approved and user is management, grant view access
  IF doc_status = 'approved' AND user_role IN ('admin', 'sales', 'ops', 'finance', 'readonly') AND _min_level = 'view' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- RLS Policies for ck_collections
CREATE POLICY "Management users can view collections"
ON public.ck_collections FOR SELECT
TO authenticated
USING (has_management_role(auth.uid(), 'admin'::management_role) 
  OR has_management_role(auth.uid(), 'sales'::management_role)
  OR has_management_role(auth.uid(), 'ops'::management_role)
  OR has_management_role(auth.uid(), 'finance'::management_role)
  OR has_management_role(auth.uid(), 'readonly'::management_role));

CREATE POLICY "Admin/Sales can manage collections"
ON public.ck_collections FOR ALL
TO authenticated
USING (has_management_role(auth.uid(), 'admin'::management_role) 
  OR has_management_role(auth.uid(), 'sales'::management_role))
WITH CHECK (has_management_role(auth.uid(), 'admin'::management_role) 
  OR has_management_role(auth.uid(), 'sales'::management_role));

-- RLS Policies for ck_docs
CREATE POLICY "Users can view docs they have access to"
ON public.ck_docs FOR SELECT
TO authenticated
USING (ck_has_doc_access(id, auth.uid(), 'view'));

CREATE POLICY "Users with edit access can update docs"
ON public.ck_docs FOR UPDATE
TO authenticated
USING (ck_has_doc_access(id, auth.uid(), 'edit'))
WITH CHECK (ck_has_doc_access(id, auth.uid(), 'edit'));

CREATE POLICY "Admin/Sales can create docs"
ON public.ck_docs FOR INSERT
TO authenticated
WITH CHECK (has_management_role(auth.uid(), 'admin'::management_role) 
  OR has_management_role(auth.uid(), 'sales'::management_role));

CREATE POLICY "Users with manage access can delete docs"
ON public.ck_docs FOR DELETE
TO authenticated
USING (ck_has_doc_access(id, auth.uid(), 'manage'));

-- RLS Policies for ck_doc_versions
CREATE POLICY "Users can view versions of accessible docs"
ON public.ck_doc_versions FOR SELECT
TO authenticated
USING (ck_has_doc_access(doc_id, auth.uid(), 'view'));

CREATE POLICY "Users with edit access can create versions"
ON public.ck_doc_versions FOR INSERT
TO authenticated
WITH CHECK (ck_has_doc_access(doc_id, auth.uid(), 'edit'));

-- RLS Policies for ck_files
CREATE POLICY "Users can view files of accessible docs"
ON public.ck_files FOR SELECT
TO authenticated
USING (ck_has_doc_access(doc_id, auth.uid(), 'view'));

CREATE POLICY "Users with edit access can upload files"
ON public.ck_files FOR INSERT
TO authenticated
WITH CHECK (ck_has_doc_access(doc_id, auth.uid(), 'edit'));

-- RLS Policies for ck_shares
CREATE POLICY "Users can view shares of accessible docs"
ON public.ck_shares FOR SELECT
TO authenticated
USING (ck_has_doc_access(doc_id, auth.uid(), 'view'));

CREATE POLICY "Users with manage access can create shares"
ON public.ck_shares FOR ALL
TO authenticated
USING (ck_has_doc_access(doc_id, auth.uid(), 'manage'))
WITH CHECK (ck_has_doc_access(doc_id, auth.uid(), 'manage'));

-- RLS Policies for ck_read_receipts
CREATE POLICY "Users can view their own receipts"
ON public.ck_read_receipts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own receipts"
ON public.ck_read_receipts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own receipts"
ON public.ck_read_receipts FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Doc managers can view all receipts"
ON public.ck_read_receipts FOR SELECT
TO authenticated
USING (ck_has_doc_access(doc_id, auth.uid(), 'manage'));

-- RLS Policies for ck_comments
CREATE POLICY "Users can view comments on accessible docs"
ON public.ck_comments FOR SELECT
TO authenticated
USING (ck_has_doc_access(doc_id, auth.uid(), 'view'));

CREATE POLICY "Users with comment access can create comments"
ON public.ck_comments FOR INSERT
TO authenticated
WITH CHECK (ck_has_doc_access(doc_id, auth.uid(), 'comment') AND user_id = auth.uid());

CREATE POLICY "Users can update their own comments"
ON public.ck_comments FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies for ck_pins
CREATE POLICY "Users can manage their own pins"
ON public.ck_pins FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies for ck_audit
CREATE POLICY "Admin can view all audit logs"
ON public.ck_audit FOR SELECT
TO authenticated
USING (has_management_role(auth.uid(), 'admin'::management_role));

CREATE POLICY "System can insert audit logs"
ON public.ck_audit FOR INSERT
TO authenticated
WITH CHECK (true);

-- Storage policies for common-knowledge bucket
CREATE POLICY "Users can view files they have doc access to"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'common-knowledge' AND
  EXISTS (
    SELECT 1 FROM public.ck_files cf
    WHERE cf.storage_path = name
    AND ck_has_doc_access(cf.doc_id, auth.uid(), 'view')
  )
);

CREATE POLICY "Users with edit access can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'common-knowledge');

CREATE POLICY "Users with manage access can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'common-knowledge' AND
  EXISTS (
    SELECT 1 FROM public.ck_files cf
    WHERE cf.storage_path = name
    AND ck_has_doc_access(cf.doc_id, auth.uid(), 'manage')
  )
);

-- Trigger to update search_text tsvector
CREATE OR REPLACE FUNCTION public.ck_update_search_text()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_text := to_tsvector('english', COALESCE(NEW.content_md, ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER ck_doc_versions_search_update
BEFORE INSERT OR UPDATE OF content_md ON public.ck_doc_versions
FOR EACH ROW
EXECUTE FUNCTION public.ck_update_search_text();

-- Trigger to update updated_at timestamps
CREATE TRIGGER ck_collections_updated_at
BEFORE UPDATE ON public.ck_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER ck_docs_updated_at
BEFORE UPDATE ON public.ck_docs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: Create document with first version
CREATE OR REPLACE FUNCTION public.rpc_ck_create_doc(
  p_title TEXT,
  p_slug TEXT,
  p_type ck_doc_type,
  p_collection_id UUID DEFAULT NULL,
  p_content_md TEXT DEFAULT '',
  p_zones TEXT[] DEFAULT '{}',
  p_tags TEXT[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc_id UUID;
  v_version_id UUID;
BEGIN
  -- Create document
  INSERT INTO public.ck_docs (
    title, slug, type, collection_id, owner_id, zones, tags, status
  ) VALUES (
    p_title, p_slug, p_type, p_collection_id, auth.uid(), p_zones, p_tags, 'draft'
  )
  RETURNING id INTO v_doc_id;
  
  -- Create first version
  INSERT INTO public.ck_doc_versions (
    doc_id, version_no, editor_id, content_md, summary
  ) VALUES (
    v_doc_id, 1, auth.uid(), p_content_md, 'Initial version'
  )
  RETURNING id INTO v_version_id;
  
  -- Update doc to point to current version
  UPDATE public.ck_docs
  SET version_current_id = v_version_id
  WHERE id = v_doc_id;
  
  -- Create initial share for owner
  INSERT INTO public.ck_shares (
    doc_id, level, grantee_type, grantee_id, created_by
  ) VALUES (
    v_doc_id, 'manage', 'user', auth.uid()::TEXT, auth.uid()
  );
  
  -- Log audit
  INSERT INTO public.ck_audit (actor_id, action, doc_id, meta)
  VALUES (auth.uid(), 'create_doc', v_doc_id, jsonb_build_object('title', p_title));
  
  RETURN v_doc_id;
END;
$$;

-- RPC: Create new version
CREATE OR REPLACE FUNCTION public.rpc_ck_new_version(
  p_doc_id UUID,
  p_content_md TEXT,
  p_summary TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_version_id UUID;
  v_next_version_no INTEGER;
BEGIN
  -- Check access
  IF NOT ck_has_doc_access(p_doc_id, auth.uid(), 'edit') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Get next version number
  SELECT COALESCE(MAX(version_no), 0) + 1
  INTO v_next_version_no
  FROM public.ck_doc_versions
  WHERE doc_id = p_doc_id;
  
  -- Create new version
  INSERT INTO public.ck_doc_versions (
    doc_id, version_no, editor_id, content_md, summary
  ) VALUES (
    p_doc_id, v_next_version_no, auth.uid(), p_content_md, p_summary
  )
  RETURNING id INTO v_version_id;
  
  -- Update doc to point to new version
  UPDATE public.ck_docs
  SET version_current_id = v_version_id, updated_at = now()
  WHERE id = p_doc_id;
  
  -- Log audit
  INSERT INTO public.ck_audit (actor_id, action, doc_id, meta)
  VALUES (auth.uid(), 'new_version', p_doc_id, jsonb_build_object('version_no', v_next_version_no));
  
  RETURN v_version_id;
END;
$$;

-- RPC: Publish document (approve and lock)
CREATE OR REPLACE FUNCTION public.rpc_ck_publish(p_doc_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check access
  IF NOT ck_has_doc_access(p_doc_id, auth.uid(), 'manage') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Update status to approved
  UPDATE public.ck_docs
  SET status = 'approved', updated_at = now()
  WHERE id = p_doc_id;
  
  -- Log audit
  INSERT INTO public.ck_audit (actor_id, action, doc_id)
  VALUES (auth.uid(), 'publish', p_doc_id);
  
  RETURN true;
END;
$$;

-- RPC: Get signed URL for file
CREATE OR REPLACE FUNCTION public.rpc_ck_get_signed_url(p_storage_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc_id UUID;
BEGIN
  -- Get doc_id from storage path
  SELECT doc_id INTO v_doc_id
  FROM public.ck_files
  WHERE storage_path = p_storage_path
  LIMIT 1;
  
  -- Check access
  IF v_doc_id IS NULL OR NOT ck_has_doc_access(v_doc_id, auth.uid(), 'view') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Return the path (actual signed URL generation happens client-side via storage.createSignedUrl)
  RETURN p_storage_path;
END;
$$;

-- RPC: Keyword search
CREATE OR REPLACE FUNCTION public.rpc_ck_keyword_search(
  p_query TEXT,
  p_status ck_doc_status DEFAULT NULL,
  p_type ck_doc_type DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  doc_id UUID,
  title TEXT,
  slug TEXT,
  type ck_doc_type,
  status ck_doc_status,
  rank REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    d.id AS doc_id,
    d.title,
    d.slug,
    d.type,
    d.status,
    ts_rank(v.search_text, websearch_to_tsquery('english', p_query)) AS rank
  FROM public.ck_docs d
  JOIN public.ck_doc_versions v ON v.id = d.version_current_id
  WHERE ck_has_doc_access(d.id, auth.uid(), 'view')
    AND (p_status IS NULL OR d.status = p_status)
    AND (p_type IS NULL OR d.type = p_type)
    AND v.search_text @@ websearch_to_tsquery('english', p_query)
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$;