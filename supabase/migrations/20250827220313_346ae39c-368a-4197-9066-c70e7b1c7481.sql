-- Enable RLS on streak tables if not already enabled
ALTER TABLE public.streak_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_grace_periods ENABLE ROW LEVEL SECURITY;

-- RLS policies for streak_weeks
CREATE POLICY "Users can view their own streak weeks" 
ON public.streak_weeks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak weeks" 
ON public.streak_weeks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak weeks" 
ON public.streak_weeks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all streak weeks" 
ON public.streak_weeks 
FOR ALL 
USING (auth.role() = 'service_role');

-- RLS policies for streak_sets
CREATE POLICY "Users can view their own streak sets" 
ON public.streak_sets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak sets" 
ON public.streak_sets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak sets" 
ON public.streak_sets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all streak sets" 
ON public.streak_sets 
FOR ALL 
USING (auth.role() = 'service_role');

-- RLS policies for streak_badges
CREATE POLICY "Users can view their own streak badges" 
ON public.streak_badges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak badges" 
ON public.streak_badges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all streak badges" 
ON public.streak_badges 
FOR ALL 
USING (auth.role() = 'service_role');

-- RLS policies for streak_rewards
CREATE POLICY "Users can view their own streak rewards" 
ON public.streak_rewards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak rewards" 
ON public.streak_rewards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak rewards" 
ON public.streak_rewards 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all streak rewards" 
ON public.streak_rewards 
FOR ALL 
USING (auth.role() = 'service_role');

-- RLS policies for streak_grace_periods
CREATE POLICY "Users can view their own grace periods" 
ON public.streak_grace_periods 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own grace periods" 
ON public.streak_grace_periods 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grace periods" 
ON public.streak_grace_periods 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all grace periods" 
ON public.streak_grace_periods 
FOR ALL 
USING (auth.role() = 'service_role');