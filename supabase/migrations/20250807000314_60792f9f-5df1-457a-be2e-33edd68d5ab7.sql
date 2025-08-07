-- Create subscribers table with GDPR compliance
CREATE TABLE public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMP WITH TIME ZONE,
  subscription_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribe_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (needed for subscription forms)
CREATE POLICY "Anyone can insert new subscribers" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public read access for unsubscribe verification" 
ON public.subscribers 
FOR SELECT 
USING (true);

CREATE POLICY "Public update for unsubscribe" 
ON public.subscribers 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_subscribers_updated_at
BEFORE UPDATE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for email lookups
CREATE INDEX idx_subscribers_email ON public.subscribers(email);
CREATE INDEX idx_subscribers_unsubscribe_token ON public.subscribers(unsubscribe_token);
CREATE INDEX idx_subscribers_active ON public.subscribers(is_active);