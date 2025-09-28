-- Add signature fields for two-stage signature process
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS staff_signature_data jsonb,
ADD COLUMN IF NOT EXISTS staff_signed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS staff_signed_by uuid,
ADD COLUMN IF NOT EXISTS client_signature_data jsonb,
ADD COLUMN IF NOT EXISTS client_signed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS signature_status text DEFAULT 'pending_staff';

-- Update existing contracts to have the new signature status
UPDATE public.contracts 
SET signature_status = CASE 
  WHEN is_signed = true THEN 'completed'
  WHEN signature_data IS NOT NULL THEN 'pending_client' 
  ELSE 'pending_staff'
END;

-- Add check constraint for signature status
ALTER TABLE public.contracts 
ADD CONSTRAINT signature_status_check 
CHECK (signature_status IN ('pending_staff', 'pending_client', 'completed'));