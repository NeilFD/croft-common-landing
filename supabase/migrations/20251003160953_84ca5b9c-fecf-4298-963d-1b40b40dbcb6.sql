-- Fix chat creation RLS issues
-- Use correct PostgreSQL policy syntax (no IF NOT EXISTS for policies)

-- Drop and recreate chats INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create chats" ON public.chats;

CREATE POLICY "Authenticated users can create chats"
  ON public.chats
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND public.get_user_management_role(auth.uid()) IS NOT NULL
  );

-- Drop and recreate chat_members INSERT policy for chat creator
DROP POLICY IF EXISTS "Chat creator can add self as admin" ON public.chat_members;

CREATE POLICY "Chat creator can add self as admin"
  ON public.chat_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_id AND c.created_by = auth.uid()
    )
  );