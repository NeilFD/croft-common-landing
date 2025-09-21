-- Add missing wallet pass tracking columns to profiles table (check if they exist first)
DO $$ 
BEGIN
    -- Add wallet_pass_last_issued_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'wallet_pass_last_issued_at') THEN
        ALTER TABLE public.profiles ADD COLUMN wallet_pass_last_issued_at timestamp with time zone;
    END IF;
    
    -- Add wallet_pass_revoked if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'wallet_pass_revoked') THEN
        ALTER TABLE public.profiles ADD COLUMN wallet_pass_revoked boolean DEFAULT false;
    END IF;
    
    -- Add wallet_pass_serial_number if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'wallet_pass_serial_number') THEN
        ALTER TABLE public.profiles ADD COLUMN wallet_pass_serial_number text UNIQUE;
    END IF;
END $$;

-- Create wallet-passes storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wallet-passes', 'wallet-passes', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for wallet passes
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own wallet passes" ON storage.objects;
    DROP POLICY IF EXISTS "Service role can manage wallet passes" ON storage.objects;
    
    -- Create new policies
    CREATE POLICY "Users can view their own wallet passes"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'wallet-passes' AND auth.uid()::text = (storage.foldername(name))[1]);

    CREATE POLICY "Service role can manage wallet passes"
    ON storage.objects
    FOR ALL
    USING (bucket_id = 'wallet-passes' AND auth.role() = 'service_role');
END $$;