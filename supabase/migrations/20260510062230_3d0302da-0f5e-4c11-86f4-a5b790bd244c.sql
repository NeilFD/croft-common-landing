CREATE TABLE public.gold_access_codes (
  code text PRIMARY KEY,
  label text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gold_access_codes ENABLE ROW LEVEL SECURITY;

-- No public policies: only service_role (used by edge function) can read/write.

INSERT INTO public.gold_access_codes (code, label) VALUES ('BEARTEST', 'Internal testers');