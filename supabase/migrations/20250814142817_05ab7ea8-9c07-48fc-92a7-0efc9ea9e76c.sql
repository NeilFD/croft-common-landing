-- Create pending_banners table for reliable notification delivery
CREATE TABLE public.pending_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_token TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  banner_message TEXT,
  url TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.pending_banners ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read pending banners (since they contain public notification data)
CREATE POLICY "Anyone can read pending banners" 
ON public.pending_banners 
FOR SELECT 
USING (true);

-- Create policy to allow system to insert pending banners (for service worker)
CREATE POLICY "System can insert pending banners" 
ON public.pending_banners 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow system to update pending banners (for marking as processed)
CREATE POLICY "System can update pending banners" 
ON public.pending_banners 
FOR UPDATE 
USING (true);

-- Create index for efficient querying
CREATE INDEX idx_pending_banners_token ON public.pending_banners(notification_token);
CREATE INDEX idx_pending_banners_processed ON public.pending_banners(processed, created_at);