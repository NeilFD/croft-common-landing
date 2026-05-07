-- Add missing columns to existing tables

-- member_moments
ALTER TABLE public.member_moments 
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS date_taken TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS ai_flags JSONB,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;

-- notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS scope TEXT,
ADD COLUMN IF NOT EXISTS dry_run BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recipients_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS success_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS campaign_id UUID;

-- notification_deliveries
ALTER TABLE public.notification_deliveries 
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS notification_id UUID;

-- push_optin_events
ALTER TABLE public.push_optin_events 
ADD COLUMN IF NOT EXISTS event TEXT;

-- mobile_debug_logs
ALTER TABLE public.mobile_debug_logs 
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS step TEXT,
ADD COLUMN IF NOT EXISTS data JSONB;

-- campaigns
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivered_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicked_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- campaign_segments
ALTER TABLE public.campaign_segments 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_spend DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS filters JSONB,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS segment_description TEXT;

-- cms_brand_assets
ALTER TABLE public.cms_brand_assets 
ADD COLUMN IF NOT EXISTS asset_key TEXT,
ADD COLUMN IF NOT EXISTS asset_value TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;

-- Create missing RPC functions
CREATE OR REPLACE FUNCTION public.get_cinema_status(p_release_id UUID)
RETURNS TABLE(
  total_bookings BIGINT,
  total_quantity BIGINT,
  remaining_capacity INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_capacity INTEGER;
BEGIN
  SELECT capacity INTO v_capacity FROM public.cinema_releases WHERE id = p_release_id;
  
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(*), 0)::BIGINT as total_bookings,
    COALESCE(SUM(quantity), 0)::BIGINT as total_quantity,
    GREATEST(0, v_capacity - COALESCE(SUM(quantity), 0))::INTEGER as remaining_capacity
  FROM public.cinema_bookings
  WHERE release_id = p_release_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_cinema_booking(
  p_release_id UUID,
  p_quantity INTEGER,
  p_guest_name TEXT DEFAULT NULL,
  p_guest_email TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_remaining INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  SELECT remaining_capacity INTO v_remaining
  FROM public.get_cinema_status(p_release_id);
  
  IF v_remaining < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough capacity');
  END IF;
  
  INSERT INTO public.cinema_bookings (release_id, user_id, quantity, guest_name, guest_email)
  VALUES (p_release_id, v_user_id, p_quantity, p_guest_name, p_guest_email);
  
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_secret_kitchen_access_status(p_kitchen_slug TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_access RECORD;
BEGIN
  v_user_id := auth.uid();
  
  SELECT * INTO v_access
  FROM public.secret_kitchen_access
  WHERE user_id = v_user_id AND kitchen_slug = p_kitchen_slug
  AND (expires_at IS NULL OR expires_at > now());
  
  IF FOUND THEN
    RETURN jsonb_build_object('has_access', true, 'granted_at', v_access.granted_at);
  ELSE
    RETURN jsonb_build_object('has_access', false);
  END IF;
END;
$$;