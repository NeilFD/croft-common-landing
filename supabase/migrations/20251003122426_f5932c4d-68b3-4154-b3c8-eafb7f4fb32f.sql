-- Allow management users to view System Chat without explicit membership

-- Messages: allow SELECT for management users on system chats
CREATE POLICY "Management can view system chat messages"
ON public.messages
FOR SELECT
USING (
  get_user_management_role(auth.uid()) IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.chats c
    WHERE c.id = messages.chat_id AND c.is_system = true
  )
);

-- Chats: allow SELECT for management users on system chats
CREATE POLICY "Management can view system chats"
ON public.chats
FOR SELECT
USING (
  is_system = true
  AND get_user_management_role(auth.uid()) IS NOT NULL
);

-- Attachments: allow SELECT for management users on attachments that belong to system chats
CREATE POLICY "Management can view attachments in system chats"
ON public.attachments
FOR SELECT
USING (
  get_user_management_role(auth.uid()) IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.messages m
    JOIN public.chats c ON c.id = m.chat_id
    WHERE m.id = attachments.message_id
      AND c.is_system = true
  )
);

-- Chat members: allow SELECT for management users to view members of system chats (for read receipts etc.)
CREATE POLICY "Management can view members of system chats"
ON public.chat_members
FOR SELECT
USING (
  get_user_management_role(auth.uid()) IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.chats c
    WHERE c.id = chat_members.chat_id AND c.is_system = true
  )
);
