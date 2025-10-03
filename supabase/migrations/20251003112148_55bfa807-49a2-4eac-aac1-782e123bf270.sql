-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can remove or users can leave" ON public.chat_members;
DROP POLICY IF EXISTS "Admins can update member status" ON public.chat_members;
DROP POLICY IF EXISTS "Chat admins can add members" ON public.chat_members;
DROP POLICY IF EXISTS "Users can view members of their chats" ON public.chat_members;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.is_chat_member(_chat_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_members
    WHERE chat_id = _chat_id
      AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_chat_admin(_chat_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_members
    WHERE chat_id = _chat_id
      AND user_id = _user_id
      AND is_admin = true
  );
$$;

-- Recreate policies using security definer functions
CREATE POLICY "Users can view members of their chats"
ON public.chat_members
FOR SELECT
USING (public.is_chat_member(chat_id, auth.uid()));

CREATE POLICY "Chat admins can add members"
ON public.chat_members
FOR INSERT
WITH CHECK (public.is_chat_admin(chat_id, auth.uid()));

CREATE POLICY "Admins can update member status"
ON public.chat_members
FOR UPDATE
USING (public.is_chat_admin(chat_id, auth.uid()));

CREATE POLICY "Admins can remove or users can leave"
ON public.chat_members
FOR DELETE
USING (
  user_id = auth.uid() OR public.is_chat_admin(chat_id, auth.uid())
);