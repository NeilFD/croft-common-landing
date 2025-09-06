-- Remove synthetic/test member data
-- These are the test user IDs that should not appear in production

-- Delete synthetic member data
DELETE FROM public.member_ledger 
WHERE user_id IN (
  '123e4567-e89b-12d3-a456-426614174000',
  '123e4567-e89b-12d3-a456-426614174001', 
  '123e4567-e89b-12d3-a456-426614174002'
);

DELETE FROM public.member_check_ins 
WHERE user_id IN (
  '123e4567-e89b-12d3-a456-426614174000',
  '123e4567-e89b-12d3-a456-426614174001',
  '123e4567-e89b-12d3-a456-426614174002'
);

DELETE FROM public.member_receipts 
WHERE user_id IN (
  '123e4567-e89b-12d3-a456-426614174000',
  '123e4567-e89b-12d3-a456-426614174001',
  '123e4567-e89b-12d3-a456-426614174002'
);

DELETE FROM public.member_profiles_extended 
WHERE user_id IN (
  '123e4567-e89b-12d3-a456-426614174000',
  '123e4567-e89b-12d3-a456-426614174001',
  '123e4567-e89b-12d3-a456-426614174002'
);

DELETE FROM public.member_streaks 
WHERE user_id IN (
  '123e4567-e89b-12d3-a456-426614174000',
  '123e4567-e89b-12d3-a456-426614174001',
  '123e4567-e89b-12d3-a456-426614174002'
);

DELETE FROM public.profiles 
WHERE user_id IN (
  '123e4567-e89b-12d3-a456-426614174000',
  '123e4567-e89b-12d3-a456-426614174001',
  '123e4567-e89b-12d3-a456-426614174002'
);