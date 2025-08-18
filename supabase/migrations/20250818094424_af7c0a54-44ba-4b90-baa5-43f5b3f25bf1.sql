-- Update pong_scores table to allow anonymous users
ALTER TABLE public.pong_scores ALTER COLUMN user_id DROP NOT NULL;

-- Add a special anonymous user constant for tracking
INSERT INTO public.app_settings (key, value) VALUES ('anonymous_user_id', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Update RLS policy to allow anonymous score insertion
DROP POLICY IF EXISTS "Authenticated users can insert their own scores" ON public.pong_scores;

CREATE POLICY "Users can insert scores" 
ON public.pong_scores 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
);