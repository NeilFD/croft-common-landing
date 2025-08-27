-- Add constraint to prevent future receipt dates
ALTER TABLE public.member_receipts 
ADD CONSTRAINT check_receipt_date_not_future 
CHECK (receipt_date <= CURRENT_DATE);