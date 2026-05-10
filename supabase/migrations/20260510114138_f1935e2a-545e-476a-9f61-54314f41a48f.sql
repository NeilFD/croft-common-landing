-- SEO management tables

CREATE TABLE public.seo_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  site_name TEXT NOT NULL DEFAULT 'Crazy Bear',
  default_title_suffix TEXT DEFAULT '| Crazy Bear',
  default_description TEXT DEFAULT 'The Crazy Bear. Town and country. Two houses, one spirit.',
  default_og_image TEXT DEFAULT '/brand/logo.png',
  organization_jsonld JSONB DEFAULT '{}'::jsonb,
  pagespeed_api_key_present BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seo_settings_singleton CHECK (id = 1)
);

INSERT INTO public.seo_settings (id) VALUES (1);

CREATE TABLE public.seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route TEXT NOT NULL UNIQUE,
  label TEXT,
  title TEXT,
  description TEXT,
  og_image TEXT,
  keywords TEXT[],
  noindex BOOLEAN NOT NULL DEFAULT false,
  jsonld JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_pages_route ON public.seo_pages(route);

CREATE TABLE public.seo_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route TEXT NOT NULL,
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'manual', -- manual | scheduled
  -- internal scan
  internal_score INTEGER, -- 0-100
  internal_checks JSONB,  -- [{id, label, status: pass|warn|fail, message}]
  -- pagespeed
  perf_score INTEGER,
  seo_score INTEGER,
  accessibility_score INTEGER,
  best_practices_score INTEGER,
  lcp_ms INTEGER,
  cls NUMERIC,
  inp_ms INTEGER,
  -- combined
  overall_score INTEGER, -- 0-100
  overall_grade TEXT, -- A+, A, B, C, D, F
  error TEXT
);

CREATE INDEX idx_seo_audits_route_run_at ON public.seo_audits(route, run_at DESC);

-- Enable RLS
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audits ENABLE ROW LEVEL SECURITY;

-- Public can read seo_pages and seo_settings (needed by CBSeo on public site)
CREATE POLICY "seo_pages public read" ON public.seo_pages FOR SELECT USING (true);
CREATE POLICY "seo_settings public read" ON public.seo_settings FOR SELECT USING (true);

-- Admins can manage everything
CREATE POLICY "seo_pages admin write insert" ON public.seo_pages FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "seo_pages admin write update" ON public.seo_pages FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "seo_pages admin write delete" ON public.seo_pages FOR DELETE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "seo_settings admin update" ON public.seo_settings FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "seo_audits admin read" ON public.seo_audits FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "seo_audits admin insert" ON public.seo_audits FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "seo_audits admin delete" ON public.seo_audits FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- updated_at triggers
CREATE TRIGGER seo_pages_updated_at BEFORE UPDATE ON public.seo_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER seo_settings_updated_at BEFORE UPDATE ON public.seo_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();