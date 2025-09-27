-- Security Hardening: Fix critical security warnings

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN 
  NEW.updated_at := now(); 
  RETURN NEW; 
END $$;

CREATE OR REPLACE FUNCTION public.check_booking_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check for overlapping bookings in the same space
  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.space_id = NEW.space_id
      AND b.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        (NEW.start_ts, NEW.end_ts) OVERLAPS (b.start_ts, b.end_ts)
      )
  ) THEN
    RAISE EXCEPTION 'Booking overlaps with existing booking in the same space' 
      USING ERRCODE = 'exclusion_violation';
  END IF;
  
  RETURN NEW;
END $$;

-- Enable RLS on tables that should have it (if not already enabled)
ALTER TABLE public.lunch_menu ENABLE ROW LEVEL SECURITY;

-- Create policies for lunch_menu if they don't exist
DROP POLICY IF EXISTS "Everyone can view available lunch menu" ON public.lunch_menu;
CREATE POLICY "Everyone can view available lunch menu" ON public.lunch_menu
FOR SELECT USING (is_available = true);

DROP POLICY IF EXISTS "Admins can manage lunch menu" ON public.lunch_menu;  
CREATE POLICY "Admins can manage lunch menu" ON public.lunch_menu
FOR ALL USING (is_email_domain_allowed(get_user_email()));

-- Ensure other critical tables have RLS enabled
DO $$ 
BEGIN
  -- Only enable RLS on tables that should have user-based access control
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
                 WHERE c.relname = 'spaces' AND n.nspname = 'public' AND c.relrowsecurity = true) THEN
    ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
    
    -- Create basic policy for spaces
    DROP POLICY IF EXISTS "Management users can view spaces" ON public.spaces;
    CREATE POLICY "Management users can view spaces" ON public.spaces
    FOR SELECT USING (
      has_management_role(auth.uid(), 'admin'::management_role)
      OR has_management_role(auth.uid(), 'sales'::management_role)  
      OR has_management_role(auth.uid(), 'ops'::management_role)
      OR has_management_role(auth.uid(), 'finance'::management_role)
      OR has_management_role(auth.uid(), 'readonly'::management_role)
    );
    
    DROP POLICY IF EXISTS "Admins and sales can manage spaces" ON public.spaces;
    CREATE POLICY "Admins and sales can manage spaces" ON public.spaces
    FOR ALL USING (
      has_management_role(auth.uid(), 'admin'::management_role)
      OR has_management_role(auth.uid(), 'sales'::management_role)
    );
  END IF;
END $$;

-- Fix space_hours RLS
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
                 WHERE c.relname = 'space_hours' AND n.nspname = 'public' AND c.relrowsecurity = true) THEN
    ALTER TABLE public.space_hours ENABLE ROW LEVEL SECURITY;
    
    -- Create basic policy for space_hours
    DROP POLICY IF EXISTS "Management users can view space hours" ON public.space_hours;
    CREATE POLICY "Management users can view space hours" ON public.space_hours
    FOR SELECT USING (
      has_management_role(auth.uid(), 'admin'::management_role)
      OR has_management_role(auth.uid(), 'sales'::management_role)  
      OR has_management_role(auth.uid(), 'ops'::management_role)
      OR has_management_role(auth.uid(), 'finance'::management_role)
      OR has_management_role(auth.uid(), 'readonly'::management_role)
    );
    
    DROP POLICY IF EXISTS "Admins and ops can manage space hours" ON public.space_hours;
    CREATE POLICY "Admins and ops can manage space hours" ON public.space_hours
    FOR ALL USING (
      has_management_role(auth.uid(), 'admin'::management_role)
      OR has_management_role(auth.uid(), 'ops'::management_role)
    );
  END IF;
END $$;