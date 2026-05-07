CREATE OR REPLACE FUNCTION public.handle_new_cb_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_interests TEXT[] := NULL;
  v_consent BOOLEAN := COALESCE((NEW.raw_user_meta_data->>'consent_given')::BOOLEAN, false);
BEGIN
  -- Safely parse interests only if it's actually a JSON array
  IF NEW.raw_user_meta_data IS NOT NULL
     AND jsonb_typeof(NEW.raw_user_meta_data->'interests') = 'array' THEN
    SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'interests'))
      INTO v_interests;
  END IF;

  BEGIN
    INSERT INTO public.cb_members (
      user_id, email, first_name, last_name, phone,
      birthday_day, birthday_month, interests,
      consent_given, consent_at, marketing_opt_in
    ) VALUES (
      NEW.id,
      NEW.email,
      NULLIF(NEW.raw_user_meta_data->>'first_name',''),
      NULLIF(NEW.raw_user_meta_data->>'last_name',''),
      NULLIF(NEW.raw_user_meta_data->>'phone',''),
      NULLIF(NEW.raw_user_meta_data->>'birthday_day','')::INTEGER,
      NULLIF(NEW.raw_user_meta_data->>'birthday_month',''),
      v_interests,
      v_consent,
      CASE WHEN v_consent THEN now() ELSE NULL END,
      COALESCE((NEW.raw_user_meta_data->>'marketing_opt_in')::BOOLEAN, true)
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Never block signup over a profile insert hiccup
    RAISE WARNING 'cb_members insert failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;