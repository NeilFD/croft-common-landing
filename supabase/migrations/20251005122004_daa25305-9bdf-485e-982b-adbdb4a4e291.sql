-- Make last_name nullable to prevent NOT NULL errors when only one name is provided
ALTER TABLE public.leads ALTER COLUMN last_name DROP NOT NULL;

-- Add event_enquiry_id to link leads back to their source enquiry
ALTER TABLE public.leads ADD COLUMN event_enquiry_id UUID REFERENCES public.event_enquiries(id);

-- Add details JSONB column to store additional event enquiry data
ALTER TABLE public.leads ADD COLUMN details JSONB DEFAULT '{}'::jsonb;

-- Create index for faster lookups
CREATE INDEX idx_leads_event_enquiry_id ON public.leads(event_enquiry_id);

-- Add comment for documentation
COMMENT ON COLUMN public.leads.details IS 'Stores additional event enquiry data like vibe, fb_style, ai_reasoning, conversation_history, etc.';