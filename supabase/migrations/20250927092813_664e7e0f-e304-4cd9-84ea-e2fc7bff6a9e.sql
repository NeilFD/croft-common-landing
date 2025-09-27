-- Phase 2 Hardening: Leads & CRM (Fixed)

-- 1. Identity consistency (FKs → profiles)
ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_owner_id_fkey,
  ADD CONSTRAINT leads_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES public.profiles(id);

ALTER TABLE public.lead_activity
  DROP CONSTRAINT IF EXISTS lead_activity_author_id_fkey,
  ADD CONSTRAINT lead_activity_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.profiles(id);

-- 2. Settings for lead email recipients
CREATE TABLE IF NOT EXISTS public.org_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on org_settings
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for org_settings (admin only)
CREATE POLICY "Admins can manage org settings" ON public.org_settings
FOR ALL USING (has_management_role(auth.uid(), 'admin'::management_role));

-- Insert default lead notification settings
INSERT INTO public.org_settings (setting_key, setting_value, description) VALUES
  ('leads_notify_recipients', 'neil@thehive-hospitality.com', 'Email addresses to notify for new leads (comma-separated)'),
  ('leads_send_client_confirmation', 'false', 'Whether to send confirmation emails to lead submitters')
ON CONFLICT (setting_key) DO NOTHING;

-- 3. Public create RPC safety (rate-limit + honeypot)
CREATE TABLE IF NOT EXISTS public.api_rate_limiter(
  key TEXT PRIMARY KEY,
  hits INT NOT NULL DEFAULT 0,
  window_starts_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.bump_rate_key(p_key TEXT, max_hits INT, window_seconds INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  allowed BOOLEAN;
BEGIN
  INSERT INTO public.api_rate_limiter(key, hits, window_starts_at) 
  VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE
    SET hits = CASE 
      WHEN now() - api_rate_limiter.window_starts_at > make_interval(secs => window_seconds) 
      THEN 1 
      ELSE api_rate_limiter.hits + 1 
    END,
    window_starts_at = CASE 
      WHEN now() - api_rate_limiter.window_starts_at > make_interval(secs => window_seconds) 
      THEN now() 
      ELSE api_rate_limiter.window_starts_at 
    END
  RETURNING (hits <= max_hits) INTO allowed;
  
  RETURN allowed;
END;
$$;

-- 4. Duplicate lead signal (fixed date arithmetic)
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads (lower(email));

CREATE OR REPLACE VIEW public.v_lead_possible_duplicates AS
SELECT l1.id AS lead_id, l2.id AS possible_duplicate_id
FROM public.leads l1
JOIN public.leads l2
  ON lower(l1.email) = lower(l2.email)
 AND l1.id <> l2.id
 AND abs(extract(epoch FROM (
   coalesce(l1.preferred_date, l1.created_at::date)::timestamp - 
   coalesce(l2.preferred_date, l2.created_at::date)::timestamp
 ))) <= 30 * 24 * 3600;

-- 5. Fast free-text search
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS search_tsv tsvector;

CREATE OR REPLACE FUNCTION public.leads_tsv_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', coalesce(NEW.first_name, '') || ' ' || coalesce(NEW.last_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.email, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.phone, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.event_type, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.message, '')), 'D');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_tsv ON public.leads;
CREATE TRIGGER trg_leads_tsv
BEFORE INSERT OR UPDATE ON public.leads
FOR EACH ROW EXECUTE PROCEDURE public.leads_tsv_update();

CREATE INDEX IF NOT EXISTS idx_leads_tsv ON public.leads USING gin (search_tsv);

-- Update existing leads with search vectors
UPDATE public.leads SET search_tsv = 
  setweight(to_tsvector('simple', coalesce(first_name, '') || ' ' || coalesce(last_name, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(email, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(phone, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(event_type, '')), 'C') ||
  setweight(to_tsvector('simple', coalesce(message, '')), 'D');

-- 6. GDPR fields on leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

-- 7. RLS nuance for system activity inserts
DROP POLICY IF EXISTS lead_activity_insert ON public.lead_activity;
CREATE POLICY lead_activity_insert ON public.lead_activity
FOR INSERT
WITH CHECK (
  has_management_role(auth.uid(), 'admin'::management_role)
  OR has_management_role(auth.uid(), 'sales'::management_role)
  OR author_id IS NULL
);

-- Update create_lead RPC with hardening
CREATE OR REPLACE FUNCTION public.create_lead(payload JSONB, client_ip TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_lead_id UUID;
  ip_key TEXT;
  rate_allowed BOOLEAN;
  honeypot_check TEXT;
BEGIN
  -- Rate limiting
  IF client_ip IS NOT NULL THEN
    ip_key := 'lead:' || encode(digest(client_ip, 'sha256'), 'hex');
    SELECT public.bump_rate_key(ip_key, 10, 3600) INTO rate_allowed;
    
    IF NOT rate_allowed THEN
      RAISE EXCEPTION 'rate_limit' USING HINT = 'Too many requests from this IP address';
    END IF;
  END IF;

  -- Honeypot check
  honeypot_check := payload->>'website';
  IF honeypot_check IS NOT NULL AND honeypot_check != '' THEN
    RAISE EXCEPTION 'spam_detected' USING HINT = 'Invalid form submission';
  END IF;

  -- Insert lead with only known fields
  INSERT INTO public.leads (
    first_name, last_name, email, phone, event_type,
    preferred_space, preferred_date, date_flexible, headcount,
    budget_low, budget_high, message, source,
    consent_marketing, privacy_accepted_at
  ) VALUES (
    payload->>'first_name',
    payload->>'last_name', 
    payload->>'email',
    payload->>'phone',
    payload->>'event_type',
    (payload->>'preferred_space')::UUID,
    (payload->>'preferred_date')::DATE,
    (payload->>'date_flexible')::BOOLEAN,
    (payload->>'headcount')::INTEGER,
    (payload->>'budget_low')::INTEGER,
    (payload->>'budget_high')::INTEGER,
    payload->>'message',
    COALESCE(payload->>'source', 'enquiry_form'),
    COALESCE((payload->>'consent_marketing')::BOOLEAN, false),
    CASE WHEN (payload->>'privacy_accepted')::BOOLEAN = true THEN now() ELSE NULL END
  ) RETURNING id INTO new_lead_id;

  -- Log audit entry
  PERFORM log_audit_entry(
    'leads',
    new_lead_id,
    'INSERT',
    NULL,
    row_to_json((SELECT d FROM (SELECT first_name, last_name, email, phone, event_type, preferred_space, preferred_date, date_flexible, headcount, budget_low, budget_high, message, source, consent_marketing, privacy_accepted_at FROM public.leads WHERE id = new_lead_id) d))::jsonb,
    auth.uid()
  );

  RETURN new_lead_id;
END;
$$;