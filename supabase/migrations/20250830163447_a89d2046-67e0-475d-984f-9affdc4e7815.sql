-- Create table for OTP codes storage
CREATE TABLE public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to manage OTP codes
CREATE POLICY "Service role can manage OTP codes"
ON public.otp_codes
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create index for efficient email lookups
CREATE INDEX idx_otp_codes_email ON public.otp_codes(email);

-- Create index for efficient cleanup of expired codes
CREATE INDEX idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- Function to cleanup expired OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < NOW();
END;
$$;