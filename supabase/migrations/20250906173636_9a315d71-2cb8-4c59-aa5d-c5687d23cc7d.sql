-- Add receipt number, time, and covers fields to member_receipts table
ALTER TABLE public.member_receipts 
ADD COLUMN receipt_number TEXT,
ADD COLUMN receipt_time TIME,
ADD COLUMN covers INTEGER;