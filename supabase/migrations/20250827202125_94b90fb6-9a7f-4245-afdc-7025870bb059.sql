-- Enhanced Receipt-Based Weekly Streak System
-- Phase 1: Database Foundation

-- First, create new tables for the enhanced streak system

-- Table to track individual week completions (Mon-Sun cycles)
CREATE TABLE public.streak_weeks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start_date DATE NOT NULL, -- Monday of the week
  week_end_date DATE NOT NULL,   -- Sunday of the week
  receipt_count INTEGER NOT NULL DEFAULT 0,
  is_complete BOOLEAN NOT NULL DEFAULT false, -- true when 2+ receipts
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- Table to track 4-week sets (consecutive completed weeks)
CREATE TABLE public.streak_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  set_number INTEGER NOT NULL, -- 1st set, 2nd set, etc.
  start_week_date DATE NOT NULL, -- Monday of first week in set
  end_week_date DATE NOT NULL,   -- Sunday of fourth week in set
  completed_weeks INTEGER NOT NULL DEFAULT 0, -- 0-4
  is_complete BOOLEAN NOT NULL DEFAULT false, -- true when 4 weeks done
  reward_tier INTEGER, -- 1=25%, 2=50%, 3=75%, 4=100%
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, set_number)
);

-- Table to track earned rewards (accumulative)
CREATE TABLE public.streak_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_tier INTEGER NOT NULL, -- 1=25%, 2=50%, 3=75%, 4=100%
  discount_percentage INTEGER NOT NULL, -- 25, 50, 75, 100
  earned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '6 months'),
  claimed_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  stripe_session_id TEXT, -- for reward redemption tracking
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to track grace periods and make-up opportunities
CREATE TABLE public.streak_grace_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  grace_type TEXT NOT NULL, -- 'grace_week' or 'makeup_opportunity'
  week_start_date DATE NOT NULL,
  used_date TIMESTAMP WITH TIME ZONE,
  is_used BOOLEAN NOT NULL DEFAULT false,
  expires_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to track badges and milestones
CREATE TABLE public.streak_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL, -- 'first_week', 'first_set', 'loyal_member', etc.
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT, -- icon name for UI
  earned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  milestone_value INTEGER, -- for tracking records (e.g., longest streak)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_type, milestone_value)
);

-- Update existing member_streaks table for new weekly system
ALTER TABLE public.member_streaks 
ADD COLUMN IF NOT EXISTS current_week_receipts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_week_start_date DATE,
ADD COLUMN IF NOT EXISTS current_set_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_set_progress INTEGER DEFAULT 0, -- weeks completed in current set
ADD COLUMN IF NOT EXISTS total_sets_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS available_grace_weeks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_consecutive_weeks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_weeks_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_reward_tier INTEGER DEFAULT 0; -- accumulative tier

-- Enable RLS on all new tables
ALTER TABLE public.streak_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_grace_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for streak_weeks
CREATE POLICY "Users can view their own streak weeks" ON public.streak_weeks
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak weeks" ON public.streak_weeks
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak weeks" ON public.streak_weeks
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all streak weeks" ON public.streak_weeks
FOR SELECT USING (is_email_domain_allowed(get_user_email()));

-- RLS Policies for streak_sets
CREATE POLICY "Users can view their own streak sets" ON public.streak_sets
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak sets" ON public.streak_sets
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak sets" ON public.streak_sets
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all streak sets" ON public.streak_sets
FOR SELECT USING (is_email_domain_allowed(get_user_email()));

-- RLS Policies for streak_rewards
CREATE POLICY "Users can view their own streak rewards" ON public.streak_rewards
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak rewards" ON public.streak_rewards
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak rewards" ON public.streak_rewards
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all streak rewards" ON public.streak_rewards
FOR SELECT USING (is_email_domain_allowed(get_user_email()));

-- RLS Policies for streak_grace_periods
CREATE POLICY "Users can view their own grace periods" ON public.streak_grace_periods
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own grace periods" ON public.streak_grace_periods
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grace periods" ON public.streak_grace_periods
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all grace periods" ON public.streak_grace_periods
FOR SELECT USING (is_email_domain_allowed(get_user_email()));

-- RLS Policies for streak_badges
CREATE POLICY "Users can view their own badges" ON public.streak_badges
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" ON public.streak_badges
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all badges" ON public.streak_badges
FOR SELECT USING (is_email_domain_allowed(get_user_email()));

-- Create helper functions
CREATE OR REPLACE FUNCTION public.get_week_start_date(input_date DATE)
RETURNS DATE AS $$
BEGIN
  -- Get Monday of the week for any given date
  RETURN input_date - ((EXTRACT(DOW FROM input_date)::INTEGER + 6) % 7);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.get_week_end_date(input_date DATE)
RETURNS DATE AS $$
BEGIN
  -- Get Sunday of the week for any given date
  RETURN public.get_week_start_date(input_date) + 6;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate current GMT week boundaries
CREATE OR REPLACE FUNCTION public.get_current_week_boundaries()
RETURNS TABLE(week_start DATE, week_end DATE) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    public.get_week_start_date(CURRENT_DATE) as week_start,
    public.get_week_end_date(CURRENT_DATE) as week_end;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create indexes for performance
CREATE INDEX idx_streak_weeks_user_week ON public.streak_weeks(user_id, week_start_date);
CREATE INDEX idx_streak_sets_user_set ON public.streak_sets(user_id, set_number);
CREATE INDEX idx_streak_rewards_user_active ON public.streak_rewards(user_id, is_active);
CREATE INDEX idx_streak_grace_user_type ON public.streak_grace_periods(user_id, grace_type, is_used);
CREATE INDEX idx_streak_badges_user_type ON public.streak_badges(user_id, badge_type);

-- Create updated_at triggers for all new tables
CREATE TRIGGER update_streak_weeks_updated_at
BEFORE UPDATE ON public.streak_weeks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_streak_sets_updated_at
BEFORE UPDATE ON public.streak_sets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_member_streaks_updated_at
BEFORE UPDATE ON public.member_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();