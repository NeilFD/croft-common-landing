-- Add banner message field to notifications table
ALTER TABLE public.notifications 
ADD COLUMN banner_message TEXT,
ADD COLUMN display_mode TEXT DEFAULT 'navigation' CHECK (display_mode IN ('navigation', 'banner', 'both'));