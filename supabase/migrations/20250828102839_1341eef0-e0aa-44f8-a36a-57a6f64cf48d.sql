-- Create missing streak system tables

-- Streak weeks table to track weekly progress
CREATE TABLE IF NOT EXISTS public.streak_weeks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  receipt_count INTEGER NOT NULL DEFAULT 0,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- Streak sets table to track 4-week sets
CREATE TABLE IF NOT EXISTS public.streak_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  set_number INTEGER NOT NULL,
  start_week_date DATE NOT NULL,
  end_week_date DATE NOT NULL,
  completed_weeks INTEGER NOT NULL DEFAULT 0,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_tier INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, set_number)
);

-- Streak rewards table
CREATE TABLE IF NOT EXISTS public.streak_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_tier INTEGER NOT NULL,
  discount_percentage INTEGER NOT NULL,
  earned_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Streak badges table
CREATE TABLE IF NOT EXISTS public.streak_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT,
  milestone_value INTEGER,
  earned_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_type, milestone_value)
);

-- Streak grace periods table
CREATE TABLE IF NOT EXISTS public.streak_grace_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  grace_type TEXT NOT NULL,
  week_start_date DATE NOT NULL,
  expires_date DATE NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for all tables
ALTER TABLE public.streak_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_grace_periods ENABLE ROW LEVEL SECURITY;

-- RLS policies for streak_weeks
CREATE POLICY "Users can view their own streak weeks" ON public.streak_weeks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak weeks" ON public.streak_weeks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all streak weeks" ON public.streak_weeks
  FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for streak_sets  
CREATE POLICY "Users can view their own streak sets" ON public.streak_sets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all streak sets" ON public.streak_sets
  FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for streak_rewards
CREATE POLICY "Users can view their own streak rewards" ON public.streak_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all streak rewards" ON public.streak_rewards
  FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for streak_badges
CREATE POLICY "Users can view their own streak badges" ON public.streak_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all streak badges" ON public.streak_badges
  FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for streak_grace_periods
CREATE POLICY "Users can view their own grace periods" ON public.streak_grace_periods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all grace periods" ON public.streak_grace_periods
  FOR ALL USING (auth.role() = 'service_role');

-- Add updated_at triggers
CREATE TRIGGER update_streak_weeks_updated_at
  BEFORE UPDATE ON public.streak_weeks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_streak_sets_updated_at
  BEFORE UPDATE ON public.streak_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();