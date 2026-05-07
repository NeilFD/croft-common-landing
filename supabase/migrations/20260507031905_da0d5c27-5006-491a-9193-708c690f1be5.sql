CREATE TABLE IF NOT EXISTS public.test_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.test_table ENABLE ROW LEVEL SECURITY;