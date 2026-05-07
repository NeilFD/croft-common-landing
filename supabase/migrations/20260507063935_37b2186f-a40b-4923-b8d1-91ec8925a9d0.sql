-- Wipe existing subscribers and auth users (clean slate for Crazy Bear)
DELETE FROM public.subscribers;
DELETE FROM auth.users;

-- New member profile table for Crazy Bear
CREATE TABLE public.cb_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  birthday_day INTEGER,
  birthday_month TEXT,
  interests TEXT[],
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_at TIMESTAMPTZ,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cb_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their own profile"
  ON public.cb_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Members can update their own profile"
  ON public.cb_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER cb_members_updated_at
  BEFORE UPDATE ON public.cb_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create cb_members row on signup, pulling metadata from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_cb_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.cb_members (
    user_id, email, first_name, last_name, phone,
    birthday_day, birthday_month, interests,
    consent_given, consent_at, marketing_opt_in
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    NULLIF(NEW.raw_user_meta_data->>'birthday_day','')::INTEGER,
    NEW.raw_user_meta_data->>'birthday_month',
    CASE WHEN NEW.raw_user_meta_data ? 'interests'
      THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'interests'))
      ELSE NULL END,
    COALESCE((NEW.raw_user_meta_data->>'consent_given')::BOOLEAN, false),
    CASE WHEN (NEW.raw_user_meta_data->>'consent_given')::BOOLEAN THEN now() ELSE NULL END,
    COALESCE((NEW.raw_user_meta_data->>'marketing_opt_in')::BOOLEAN, true)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_cb_member
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_cb_member();