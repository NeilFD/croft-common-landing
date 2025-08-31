-- Create table for tracking access reminder emails
CREATE TABLE public.secret_kitchen_email_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  email_type TEXT NOT NULL, -- '6h', '2h', '1h', 'expired'
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  access_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.secret_kitchen_email_log ENABLE ROW LEVEL SECURITY;

-- Create policies for email log table
CREATE POLICY "Allowed domain users can view email logs" 
ON public.secret_kitchen_email_log 
FOR SELECT 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Service role can manage email logs" 
ON public.secret_kitchen_email_log 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Create index for efficient queries
CREATE INDEX idx_secret_kitchen_email_log_user_email ON public.secret_kitchen_email_log(user_email);
CREATE INDEX idx_secret_kitchen_email_log_type_sent ON public.secret_kitchen_email_log(email_type, sent_at);
CREATE INDEX idx_secret_kitchen_email_log_expires ON public.secret_kitchen_email_log(access_expires_at);