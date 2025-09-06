-- Add unique constraint for duplicate receipt detection
-- This prevents the same receipt from being uploaded by multiple members
CREATE UNIQUE INDEX idx_member_receipts_unique_receipt 
ON public.member_receipts (receipt_number, receipt_date, receipt_time) 
WHERE receipt_number IS NOT NULL AND receipt_time IS NOT NULL;

-- Add partial unique index for fallback when receipt_time is missing
CREATE UNIQUE INDEX idx_member_receipts_unique_receipt_fallback 
ON public.member_receipts (receipt_number, receipt_date) 
WHERE receipt_number IS NOT NULL AND receipt_time IS NULL;