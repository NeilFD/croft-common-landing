-- Phase 1 Hardening: Data integrity, audit RLS, and edit-scope enforcement

-- 1) Spaces: slug uniqueness + server normalisation
CREATE UNIQUE INDEX IF NOT EXISTS spaces_slug_uidx ON public.spaces (slug);

-- Add capacity check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'spaces_capacity_chk' 
    AND table_name = 'spaces' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.spaces
      ADD CONSTRAINT spaces_capacity_chk
      CHECK (capacity_seated >= 0 AND capacity_standing >= 0);
  END IF;
END $$;

-- Slugify function for consistent slug normalization
CREATE OR REPLACE FUNCTION public.slugify(src text)
RETURNS text 
LANGUAGE sql 
IMMUTABLE 
SET search_path = 'public'
AS $$
  SELECT regexp_replace(
           regexp_replace(lower(coalesce(src,'')), '[^a-z0-9]+', '-', 'g'),
           '(^-+|-+$)', '', 'g'
         )
$$;

-- Trigger function to auto-normalize slugs
CREATE OR REPLACE FUNCTION public.spaces_slug_guard()
RETURNS trigger 
LANGUAGE plpgsql 
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.slugify(NEW.name);
  ELSE
    NEW.slug := public.slugify(NEW.slug);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_spaces_slug_guard ON public.spaces;
CREATE TRIGGER trg_spaces_slug_guard
  BEFORE INSERT OR UPDATE ON public.spaces
  FOR EACH ROW EXECUTE FUNCTION public.spaces_slug_guard();

-- 2) Space hours: server-side integrity
CREATE UNIQUE INDEX IF NOT EXISTS space_hours_unique_day
  ON public.space_hours (space_id, day_of_week);

-- Add constraints with proper logic for midnight crossover
DO $$
BEGIN
  -- Day of week constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'space_hours_dow_chk' 
    AND table_name = 'space_hours' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.space_hours
      ADD CONSTRAINT space_hours_dow_chk 
      CHECK (day_of_week BETWEEN 0 AND 6);
  END IF;

  -- Time constraint - allow midnight crossover (close times from 00:00 to 06:00 are treated as next day)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'space_hours_time_chk' 
    AND table_name = 'space_hours' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.space_hours
      ADD CONSTRAINT space_hours_time_chk 
      CHECK (
        open_time < close_time OR 
        (close_time >= '00:00:00'::time AND close_time <= '06:00:00'::time)
      );
  END IF;

  -- Buffer constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'space_hours_buffer_chk' 
    AND table_name = 'space_hours' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.space_hours
      ADD CONSTRAINT space_hours_buffer_chk
      CHECK (buffer_before_min >= 0 AND buffer_after_min >= 0);
  END IF;
END $$;

-- 3) Sales edit-scope enforcement
CREATE OR REPLACE FUNCTION public.spaces_sales_guard()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE 
  user_role management_role := public.get_user_management_role(auth.uid());
BEGIN
  IF user_role = 'sales' THEN
    -- Disallow changes to slug for sales (extensible pattern)
    IF NEW.slug IS DISTINCT FROM OLD.slug THEN
      RAISE EXCEPTION 'Sales role cannot modify slug field';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_spaces_sales_guard ON public.spaces;
CREATE TRIGGER trg_spaces_sales_guard
  BEFORE UPDATE ON public.spaces
  FOR EACH ROW EXECUTE FUNCTION public.spaces_sales_guard();

-- 4) Audit log - explicit RLS for SELECT
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Admin and finance can view all audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_log;

-- Create restrictive SELECT policies
CREATE POLICY "audit_select_admin_finance" 
  ON public.audit_log FOR SELECT
  USING (public.get_user_management_role(auth.uid()) IN ('admin'::management_role, 'finance'::management_role));

CREATE POLICY "audit_select_self" 
  ON public.audit_log FOR SELECT
  USING (actor_id = auth.uid());

-- Add performance index for audit queries
CREATE INDEX IF NOT EXISTS audit_log_actor_created_idx 
  ON public.audit_log (actor_id, created_at DESC);

-- 5) Timestamps trigger - ensure updated_at columns exist
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.space_hours ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create reusable updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger 
LANGUAGE plpgsql 
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS trg_spaces_updated_at ON public.spaces;
CREATE TRIGGER trg_spaces_updated_at
  BEFORE UPDATE ON public.spaces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_space_hours_updated_at ON public.space_hours;
CREATE TRIGGER trg_space_hours_updated_at
  BEFORE UPDATE ON public.space_hours
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6) Update seed data with realistic UK licensing hours
-- Clear existing generic hours
DELETE FROM public.space_hours;

-- Insert realistic trading hours for all existing spaces
DO $$
DECLARE
  space_record RECORD;
BEGIN
  FOR space_record IN SELECT id FROM public.spaces LOOP
    -- Sunday (0) to Wednesday (3): 07:00-23:00
    INSERT INTO public.space_hours (space_id, day_of_week, open_time, close_time, buffer_before_min, buffer_after_min)
    VALUES 
      (space_record.id, 0, '07:00'::time, '23:00'::time, 30, 60), -- Sunday
      (space_record.id, 1, '07:00'::time, '23:00'::time, 30, 60), -- Monday
      (space_record.id, 2, '07:00'::time, '23:00'::time, 30, 60), -- Tuesday
      (space_record.id, 3, '07:00'::time, '23:00'::time, 30, 60); -- Wednesday
    
    -- Thursday (4): 07:00-00:00 (midnight = next day)
    INSERT INTO public.space_hours (space_id, day_of_week, open_time, close_time, buffer_before_min, buffer_after_min)
    VALUES (space_record.id, 4, '07:00'::time, '00:00'::time, 30, 60);
    
    -- Friday (5) and Saturday (6): 07:00-01:00 (late night into next day)
    INSERT INTO public.space_hours (space_id, day_of_week, open_time, close_time, buffer_before_min, buffer_after_min)
    VALUES 
      (space_record.id, 5, '07:00'::time, '01:00'::time, 30, 60), -- Friday
      (space_record.id, 6, '07:00'::time, '01:00'::time, 30, 60); -- Saturday
  END LOOP;
END $$;