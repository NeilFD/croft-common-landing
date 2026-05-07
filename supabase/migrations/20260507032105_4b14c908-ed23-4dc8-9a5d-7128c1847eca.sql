-- Fix RPC functions to match code expectations

-- Drop existing functions to recreate with correct signatures
DROP FUNCTION IF EXISTS public.create_cinema_booking(UUID, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.check_secret_kitchen_access_status(TEXT);

-- create_cinema_booking as expected by SecretCinemaModal.tsx
CREATE OR REPLACE FUNCTION public.create_cinema_booking(
  _user_id UUID,
  _email TEXT,
  _primary_name TEXT,
  _guest_name TEXT,
  _quantity INTEGER
)
RETURNS TABLE(
  ticket_numbers INTEGER[],
  release_id UUID
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_release_id UUID;
  v_capacity INTEGER;
  v_booked INTEGER;
  v_month_key TEXT;
  v_tickets INTEGER[];
BEGIN
  -- Find the active release for the current month
  v_month_key := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  
  SELECT id, capacity INTO v_release_id, v_capacity
  FROM public.cinema_releases
  WHERE month_key = v_month_key AND is_active = true
  ORDER BY screening_date DESC
  LIMIT 1;
  
  IF v_release_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Check remaining capacity
  SELECT COALESCE(SUM(quantity), 0) INTO v_booked
  FROM public.cinema_bookings
  WHERE release_id = v_release_id;
  
  IF (v_capacity - v_booked) < _quantity THEN
    RETURN;
  END IF;
  
  -- Create bookings and generate ticket numbers
  FOR i IN 1.._quantity LOOP
    v_tickets := array_append(v_tickets, v_booked + i);
  END LOOP;
  
  INSERT INTO public.cinema_bookings (release_id, user_id, quantity, guest_name, guest_email)
  VALUES (v_release_id, _user_id, _quantity, _primary_name || COALESCE(' + ' || _guest_name, ''), _email);
  
  RETURN QUERY SELECT v_tickets, v_release_id;
END;
$$;

-- check_secret_kitchen_access_status as expected by SecretKitchensAuthModal.tsx
CREATE OR REPLACE FUNCTION public.check_secret_kitchen_access_status(
  user_email TEXT
)
RETURNS TABLE(
  has_access BOOLEAN,
  kitchen_slug TEXT,
  granted_at TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = user_email LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false::BOOLEAN, NULL::TEXT, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    true::BOOLEAN as has_access,
    ska.kitchen_slug,
    ska.granted_at
  FROM public.secret_kitchen_access ska
  WHERE ska.user_id = v_user_id
    AND (ska.expires_at IS NULL OR ska.expires_at > now())
  LIMIT 1;
  
  -- If no rows returned, the calling code won't get has_access
  -- The component expects Array.isArray(data) && data.length > 0
END;
$$;

-- Add CMS columns that components expect
ALTER TABLE public.cms_design_tokens 
ADD COLUMN IF NOT EXISTS token_type TEXT,
ADD COLUMN IF NOT EXISTS token_key TEXT,
ADD COLUMN IF NOT EXISTS token_value TEXT,
ADD COLUMN IF NOT EXISTS css_variable TEXT,
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;

ALTER TABLE public.cms_brand_assets 
ADD COLUMN IF NOT EXISTS asset_key TEXT,
ADD COLUMN IF NOT EXISTS asset_value TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;

ALTER TABLE public.cms_content 
ADD COLUMN IF NOT EXISTS content_key TEXT,
ADD COLUMN IF NOT EXISTS content_type TEXT,
ADD COLUMN IF NOT EXISTS content_data JSONB,
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;

ALTER TABLE public.cms_global_content 
ADD COLUMN IF NOT EXISTS content_key TEXT,
ADD COLUMN IF NOT EXISTS content_value TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID;