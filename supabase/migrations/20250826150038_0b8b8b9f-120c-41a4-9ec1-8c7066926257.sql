-- Create member check-ins table for daily streak tracking
CREATE TABLE public.member_check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entrance_slug TEXT NOT NULL,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  streak_day INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create member streaks table for tracking streak data
CREATE TABLE public.member_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_check_in_date DATE,
  total_check_ins INTEGER NOT NULL DEFAULT 0,
  streak_rewards_earned JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create member receipts table for AI OCR receipt tracking
CREATE TABLE public.member_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  receipt_image_url TEXT NOT NULL,
  receipt_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  venue_location TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  raw_ocr_data JSONB,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create member ledger table for activity timeline
CREATE TABLE public.member_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  activity_date DATE NOT NULL,
  activity_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'GBP',
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create extended member profiles for additional data
CREATE TABLE public.member_profiles_extended (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  avatar_url TEXT,
  display_name TEXT,
  join_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tier_badge TEXT DEFAULT 'bronze',
  favorite_venue TEXT,
  favorite_drink TEXT,
  visit_time_preference TEXT,
  beer_style_preferences TEXT[],
  dietary_notes TEXT,
  hide_from_leaderboards BOOLEAN NOT NULL DEFAULT false,
  auto_insights JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraints and indexes
CREATE UNIQUE INDEX idx_member_check_ins_user_date ON public.member_check_ins(user_id, check_in_date);
CREATE INDEX idx_member_check_ins_user_timestamp ON public.member_check_ins(user_id, check_in_timestamp DESC);
CREATE INDEX idx_member_receipts_user_date ON public.member_receipts(user_id, receipt_date DESC);
CREATE INDEX idx_member_ledger_user_date ON public.member_ledger(user_id, activity_date DESC);
CREATE INDEX idx_member_ledger_activity_type ON public.member_ledger(activity_type);

-- Enable RLS on all tables
ALTER TABLE public.member_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_profiles_extended ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for member_check_ins
CREATE POLICY "Users can view their own check-ins" ON public.member_check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own check-ins" ON public.member_check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for member_streaks
CREATE POLICY "Users can view their own streaks" ON public.member_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own streaks" ON public.member_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own streaks" ON public.member_streaks FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for member_receipts
CREATE POLICY "Users can view their own receipts" ON public.member_receipts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own receipts" ON public.member_receipts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own receipts" ON public.member_receipts FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for member_ledger
CREATE POLICY "Users can view their own ledger" ON public.member_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ledger entries" ON public.member_ledger FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for member_profiles_extended
CREATE POLICY "Users can view their own extended profile" ON public.member_profiles_extended FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own extended profile" ON public.member_profiles_extended FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own extended profile" ON public.member_profiles_extended FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies (for allowed domain users)
CREATE POLICY "Admins can view all check-ins" ON public.member_check_ins FOR SELECT USING (is_email_domain_allowed(get_user_email()));
CREATE POLICY "Admins can view all streaks" ON public.member_streaks FOR SELECT USING (is_email_domain_allowed(get_user_email()));
CREATE POLICY "Admins can view all receipts" ON public.member_receipts FOR SELECT USING (is_email_domain_allowed(get_user_email()));
CREATE POLICY "Admins can view all ledger entries" ON public.member_ledger FOR SELECT USING (is_email_domain_allowed(get_user_email()));
CREATE POLICY "Admins can view all extended profiles" ON public.member_profiles_extended FOR SELECT USING (is_email_domain_allowed(get_user_email()));

-- Create functions for streak calculation
CREATE OR REPLACE FUNCTION public.calculate_member_streak(user_id_input UUID)
RETURNS TABLE(current_streak INTEGER, longest_streak INTEGER, total_check_ins INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  check_in_dates DATE[];
  current_streak_val INTEGER := 0;
  longest_streak_val INTEGER := 0;
  temp_streak INTEGER := 0;
  prev_date DATE;
  check_date DATE;
  total_count INTEGER;
BEGIN
  -- Get all check-in dates for user, ordered by date
  SELECT array_agg(check_in_date ORDER BY check_in_date) 
  INTO check_in_dates
  FROM public.member_check_ins 
  WHERE user_id = user_id_input;
  
  -- Get total count
  SELECT COUNT(*) INTO total_count FROM public.member_check_ins WHERE user_id = user_id_input;
  
  IF check_in_dates IS NULL OR array_length(check_in_dates, 1) = 0 THEN
    RETURN QUERY SELECT 0, 0, 0;
    RETURN;
  END IF;
  
  -- Calculate streaks
  FOR i IN 1..array_length(check_in_dates, 1) LOOP
    check_date := check_in_dates[i];
    
    IF i = 1 THEN
      temp_streak := 1;
    ELSIF check_date = prev_date + INTERVAL '1 day' THEN
      temp_streak := temp_streak + 1;
    ELSE
      temp_streak := 1;
    END IF;
    
    -- Update longest streak
    IF temp_streak > longest_streak_val THEN
      longest_streak_val := temp_streak;
    END IF;
    
    prev_date := check_date;
  END LOOP;
  
  -- Current streak is the streak ending on the most recent date
  -- Only if the most recent date is today or yesterday
  IF check_in_dates[array_length(check_in_dates, 1)] >= CURRENT_DATE - INTERVAL '1 day' THEN
    current_streak_val := temp_streak;
  ELSE
    current_streak_val := 0;
  END IF;
  
  RETURN QUERY SELECT current_streak_val, longest_streak_val, total_count;
END;
$$;

-- Create trigger functions for automatic updates
CREATE OR REPLACE FUNCTION public.update_member_streak_on_checkin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streak_data RECORD;
BEGIN
  -- Calculate current streaks
  SELECT * INTO streak_data 
  FROM public.calculate_member_streak(NEW.user_id);
  
  -- Upsert streak record
  INSERT INTO public.member_streaks (user_id, current_streak, longest_streak, last_check_in_date, total_check_ins)
  VALUES (NEW.user_id, streak_data.current_streak, streak_data.longest_streak, NEW.check_in_date, streak_data.total_check_ins)
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = streak_data.current_streak,
    longest_streak = GREATEST(member_streaks.longest_streak, streak_data.longest_streak),
    last_check_in_date = NEW.check_in_date,
    total_check_ins = streak_data.total_check_ins,
    updated_at = now();
  
  -- Insert ledger entry
  INSERT INTO public.member_ledger (user_id, activity_type, activity_date, description, metadata)
  VALUES (
    NEW.user_id,
    'check_in',
    NEW.check_in_date,
    'Daily check-in at ' || COALESCE(NEW.entrance_slug, 'venue'),
    jsonb_build_object('entrance_slug', NEW.entrance_slug, 'streak_day', streak_data.current_streak)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic streak updates
CREATE TRIGGER trigger_update_member_streak
  AFTER INSERT ON public.member_check_ins
  FOR EACH ROW EXECUTE FUNCTION public.update_member_streak_on_checkin();

-- Create trigger for receipt ledger entries
CREATE OR REPLACE FUNCTION public.update_ledger_on_receipt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert ledger entry for receipt
  INSERT INTO public.member_ledger (user_id, activity_type, activity_date, amount, currency, description, related_id, metadata)
  VALUES (
    NEW.user_id,
    'receipt',
    NEW.receipt_date,
    NEW.total_amount,
    NEW.currency,
    'Receipt upload - £' || NEW.total_amount::text,
    NEW.id,
    jsonb_build_object('venue_location', NEW.venue_location, 'items_count', jsonb_array_length(COALESCE(NEW.items, '[]'::jsonb)))
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for receipt ledger updates
CREATE TRIGGER trigger_update_ledger_on_receipt
  AFTER INSERT ON public.member_receipts
  FOR EACH ROW EXECUTE FUNCTION public.update_ledger_on_receipt();