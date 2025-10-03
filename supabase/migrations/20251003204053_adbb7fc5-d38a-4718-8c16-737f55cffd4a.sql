-- Create a SECURITY DEFINER function to fetch messages for a chat
-- This bypasses RLS by executing with elevated privileges
CREATE OR REPLACE FUNCTION public.get_chat_messages_basic(_chat_id uuid)
RETURNS TABLE (
  id uuid,
  chat_id uuid,
  sender_id uuid,
  body_text text,
  created_at timestamp with time zone,
  edited_at timestamp with time zone,
  deleted_at timestamp with time zone,
  is_cleo boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user can view this chat
  IF NOT can_view_chat(auth.uid(), _chat_id) THEN
    RAISE EXCEPTION 'Access denied to chat';
  END IF;

  -- Return messages for this chat
  RETURN QUERY
  SELECT 
    m.id,
    m.chat_id,
    m.sender_id,
    m.body_text,
    m.created_at,
    m.edited_at,
    m.deleted_at,
    m.is_cleo
  FROM public.messages m
  WHERE m.chat_id = _chat_id
    AND m.deleted_at IS NULL
  ORDER BY m.created_at ASC;
END;
$$;