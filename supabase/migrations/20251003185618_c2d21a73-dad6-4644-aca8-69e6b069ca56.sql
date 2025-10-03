-- Adjust get_chat_messages to use correct column names and attachment shape
CREATE OR REPLACE FUNCTION public.get_chat_messages(_chat_id uuid)
RETURNS TABLE(
  id uuid,
  chat_id uuid,
  sender_id uuid,
  body text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  edited_at timestamp with time zone,
  deleted_at timestamp with time zone,
  read_by uuid[],
  sender_name text,
  sender_role management_role,
  attachments jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.chat_id,
    m.sender_id,
    m.body_text AS body,
    m.created_at,
    m.updated_at,
    m.edited_at,
    m.deleted_at,
    m.read_by,
    COALESCE(mp.user_name, p.first_name || ' ' || p.last_name) as sender_name,
    get_user_management_role(m.sender_id) as sender_role,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', a.id,
            'type', a.type,
            'mime', a.mime,
            'width', a.width,
            'height', a.height,
            'storage_path', a.storage_path
          )
        )
        FROM public.attachments a
        WHERE a.message_id = m.id
      ),
      '[]'::jsonb
    ) as attachments
  FROM public.messages m
  LEFT JOIN public.profiles p ON p.user_id = m.sender_id
  LEFT JOIN public.management_profiles mp ON mp.user_id = m.sender_id
  WHERE m.chat_id = _chat_id
    AND m.deleted_at IS NULL
    AND (
      can_view_chat(auth.uid(), _chat_id)
      OR (
        get_user_management_role(auth.uid()) IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.chats c WHERE c.id = _chat_id AND c.is_system = true
        )
      )
    )
  ORDER BY m.created_at ASC;
END;
$$;