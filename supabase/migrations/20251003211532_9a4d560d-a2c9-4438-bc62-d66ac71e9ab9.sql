-- 1) Safety check: ensure the table exists
DO $$
BEGIN
  IF to_regclass('public.messages') IS NULL THEN
    RAISE EXCEPTION 'Table public.messages does not exist';
  END IF;
END$$;

-- 2) Drop ALL existing policies on public.messages
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.messages', pol.policyname);
  END LOOP;
END$$;

-- 3) Enable RLS and allow public SELECT only
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read all messages"
ON public.messages
FOR SELECT
TO anon, authenticated
USING (true);

-- 4) Ensure privileges are granted
GRANT SELECT ON public.messages TO anon, authenticated;