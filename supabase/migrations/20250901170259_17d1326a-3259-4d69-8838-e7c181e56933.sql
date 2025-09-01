-- Create table for Secret Kitchens OTP codes
CREATE TABLE public.secret_kitchens_otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  consumed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.secret_kitchens_otp_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access only (edge functions will manage this table)
CREATE POLICY "Service role can manage OTP codes" 
ON public.secret_kitchens_otp_codes 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to cleanup expired OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_secret_kitchens_otp_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.secret_kitchens_otp_codes WHERE expires_at < NOW();
END;
$$;

-- Create index for performance
CREATE INDEX idx_secret_kitchens_otp_codes_email ON public.secret_kitchens_otp_codes(email);
CREATE INDEX idx_secret_kitchens_otp_codes_expires_at ON public.secret_kitchens_otp_codes(expires_at);