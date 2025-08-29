-- Create mobile debug logs table for PWA troubleshooting
CREATE TABLE IF NOT EXISTS public.mobile_debug_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  step TEXT NOT NULL,
  data JSONB,
  error_message TEXT,
  user_agent TEXT,
  platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mobile_debug_logs ENABLE ROW LEVEL SECURITY;

-- Create policies - allow all users to insert debug logs
CREATE POLICY "Anyone can insert debug logs" 
ON public.mobile_debug_logs 
FOR INSERT 
WITH CHECK (true);

-- Allow users to view their own logs (for debugging)
CREATE POLICY "Users can view their own debug logs" 
ON public.mobile_debug_logs 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Add index for performance
CREATE INDEX idx_mobile_debug_logs_session_id ON public.mobile_debug_logs(session_id);
CREATE INDEX idx_mobile_debug_logs_created_at ON public.mobile_debug_logs(created_at DESC);