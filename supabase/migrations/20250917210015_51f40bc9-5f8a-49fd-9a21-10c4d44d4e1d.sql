-- Add week_applied_to column to streak_grace_periods table
ALTER TABLE public.streak_grace_periods 
ADD COLUMN week_applied_to DATE NULL;

-- Create index for better query performance
CREATE INDEX idx_streak_grace_periods_week_applied_to 
ON public.streak_grace_periods(week_applied_to);