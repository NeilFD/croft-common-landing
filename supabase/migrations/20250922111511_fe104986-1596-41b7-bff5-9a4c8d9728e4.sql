-- Create wallet-passes storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('wallet-passes', 'wallet-passes', false, 5242880, ARRAY['application/vnd.apple.pkpass', 'application/json'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/vnd.apple.pkpass', 'application/json'];

-- Create RLS policies for wallet-passes bucket
CREATE POLICY "Users can view their own wallet passes" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'wallet-passes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service role can manage wallet passes" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'wallet-passes' AND auth.role() = 'service_role');

-- Add wallet pass tracking columns to profiles table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'wallet_pass_url') THEN
    ALTER TABLE public.profiles ADD COLUMN wallet_pass_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'wallet_pass_last_issued_at') THEN
    ALTER TABLE public.profiles ADD COLUMN wallet_pass_last_issued_at timestamp with time zone;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'wallet_pass_serial_number') THEN
    ALTER TABLE public.profiles ADD COLUMN wallet_pass_serial_number text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'wallet_pass_revoked') THEN
    ALTER TABLE public.profiles ADD COLUMN wallet_pass_revoked boolean DEFAULT false;
  END IF;
END $$;