-- Create chat type enum
CREATE TYPE chat_type AS ENUM ('dm', 'group');

-- Chats table
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type chat_type NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat members (many-to-many)
CREATE TABLE public.chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  UNIQUE(chat_id, user_id)
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body_text TEXT NOT NULL,
  reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Message reactions
CREATE TABLE public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Attachments
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'image',
  storage_path TEXT NOT NULL,
  mime TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Read receipts
CREATE TABLE public.read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Indexes
CREATE INDEX idx_chat_members_user ON public.chat_members(user_id);
CREATE INDEX idx_chat_members_chat ON public.chat_members(chat_id);
CREATE INDEX idx_messages_chat ON public.messages(chat_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_read_receipts_message ON public.read_receipts(message_id);
CREATE INDEX idx_read_receipts_user ON public.read_receipts(user_id);

-- Enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.read_receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chats
CREATE POLICY "Users can view chats they belong to"
ON public.chats FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE chat_members.chat_id = chats.id
    AND chat_members.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create chats"
ON public.chats FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Chat admins can update"
ON public.chats FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE chat_members.chat_id = chats.id
    AND chat_members.user_id = auth.uid()
    AND chat_members.is_admin = true
  )
);

CREATE POLICY "Chat admins can delete non-system chats"
ON public.chats FOR DELETE
USING (
  is_system = false
  AND EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE chat_members.chat_id = chats.id
    AND chat_members.user_id = auth.uid()
    AND chat_members.is_admin = true
  )
);

-- RLS Policies for chat_members
CREATE POLICY "Users can view members of their chats"
ON public.chat_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm2
    WHERE cm2.chat_id = chat_members.chat_id
    AND cm2.user_id = auth.uid()
  )
);

CREATE POLICY "Chat admins can add members"
ON public.chat_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.chat_id = chat_members.chat_id
    AND cm.user_id = auth.uid()
    AND cm.is_admin = true
  )
);

CREATE POLICY "Admins can remove or users can leave"
ON public.chat_members FOR DELETE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.chat_members cm2
    WHERE cm2.chat_id = chat_members.chat_id
    AND cm2.user_id = auth.uid()
    AND cm2.is_admin = true
  )
);

CREATE POLICY "Admins can update member status"
ON public.chat_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm2
    WHERE cm2.chat_id = chat_members.chat_id
    AND cm2.user_id = auth.uid()
    AND cm2.is_admin = true
  )
);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their chats"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE chat_members.chat_id = messages.chat_id
    AND chat_members.user_id = auth.uid()
  )
);

CREATE POLICY "Chat members can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE chat_members.chat_id = messages.chat_id
    AND chat_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can edit their own messages"
ON public.messages FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- RLS Policies for reactions
CREATE POLICY "Users can view reactions in their chats"
ON public.message_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    INNER JOIN public.chat_members cm ON cm.chat_id = m.chat_id
    WHERE m.id = message_reactions.message_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add reactions"
ON public.message_reactions FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.messages m
    INNER JOIN public.chat_members cm ON cm.chat_id = m.chat_id
    WHERE m.id = message_reactions.message_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove their own reactions"
ON public.message_reactions FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for attachments
CREATE POLICY "Users can view attachments in their chats"
ON public.attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    INNER JOIN public.chat_members cm ON cm.chat_id = m.chat_id
    WHERE m.id = attachments.message_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add attachments to their messages"
ON public.attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = attachments.message_id
    AND m.sender_id = auth.uid()
  )
);

-- RLS Policies for read_receipts
CREATE POLICY "Users can view read receipts in their chats"
ON public.read_receipts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    INNER JOIN public.chat_members cm ON cm.chat_id = m.chat_id
    WHERE m.id = read_receipts.message_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own read receipts"
ON public.read_receipts FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Helper function: Get user display info
CREATE OR REPLACE FUNCTION public.get_chat_user_info(_user_id UUID)
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    COALESCE(p.first_name || ' ' || p.last_name, au.email) as display_name,
    NULL::TEXT as avatar_url,
    ur.role::TEXT
  FROM public.profiles p
  INNER JOIN auth.users au ON au.id = p.user_id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE p.user_id = _user_id;
END;
$$;

-- Helper function: Get unread count for user
CREATE OR REPLACE FUNCTION public.get_unread_count(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT m.id) INTO unread_count
  FROM public.messages m
  INNER JOIN public.chat_members cm ON cm.chat_id = m.chat_id
  WHERE cm.user_id = _user_id
  AND m.created_at > COALESCE(cm.last_read_at, '1970-01-01'::TIMESTAMPTZ)
  AND m.sender_id != _user_id
  AND m.deleted_at IS NULL;
  
  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Trigger to update chats.updated_at
CREATE OR REPLACE FUNCTION public.update_chat_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.chats
  SET updated_at = now()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_chat_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_chat_timestamp();

-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Chat members can view images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-images'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Chat members can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-images'
  AND auth.uid() IS NOT NULL
);

-- Seed system chat
DO $$
DECLARE
  system_chat_id UUID;
BEGIN
  -- Create system chat
  INSERT INTO public.chats (type, name, created_by, is_system)
  VALUES (
    'group',
    'Croft Common Management',
    'b049165e-6541-42c2-b5e0-34df019ef7ce',
    true
  )
  RETURNING id INTO system_chat_id;

  -- Add Neil as admin
  INSERT INTO public.chat_members (chat_id, user_id, is_admin)
  VALUES (system_chat_id, 'b049165e-6541-42c2-b5e0-34df019ef7ce', true);

  -- Add all other management users as members
  INSERT INTO public.chat_members (chat_id, user_id, is_admin)
  SELECT system_chat_id, ur.user_id, false
  FROM public.user_roles ur
  WHERE ur.user_id != 'b049165e-6541-42c2-b5e0-34df019ef7ce'
  ON CONFLICT DO NOTHING;
END $$;