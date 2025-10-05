-- Change pricing_tier from text to text array
ALTER TABLE spaces 
ALTER COLUMN pricing_tier TYPE text[] USING ARRAY[pricing_tier]::text[];