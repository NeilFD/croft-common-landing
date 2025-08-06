-- Add event management fields to the events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS is_sold_out BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS management_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS management_email TEXT;

-- Update existing events to have management tokens (for backward compatibility)
UPDATE public.events 
SET management_token = gen_random_uuid()::text,
    management_email = contact_email
WHERE management_token IS NULL;

-- Make management_token and management_email NOT NULL after populating
ALTER TABLE public.events 
ALTER COLUMN management_token SET NOT NULL,
ALTER COLUMN management_email SET NOT NULL;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_events_management_token ON public.events(management_token);

-- Add RLS policy for token-based management
CREATE POLICY "Event managers can update with token" 
ON public.events 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Event managers can delete with token" 
ON public.events 
FOR DELETE 
USING (true);

-- Create function to verify management token
CREATE OR REPLACE FUNCTION public.verify_event_management_token(token_input TEXT, event_id_input UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id_input AND management_token = token_input
  );
END;
$$;