-- Add 'logged' to delivery_status enum to fix verification error
ALTER TYPE delivery_status ADD VALUE 'logged';