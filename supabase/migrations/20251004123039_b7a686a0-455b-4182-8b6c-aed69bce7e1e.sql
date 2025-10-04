-- RLS policies for message updates and soft deletes
CREATE POLICY "Users can edit their own messages"
ON public.messages
FOR UPDATE
USING (
  sender_id = auth.uid() 
  AND deleted_at IS NULL
)
WITH CHECK (
  sender_id = auth.uid()
  AND deleted_at IS NULL
);

CREATE POLICY "Users can soft-delete their own messages"
ON public.messages
FOR UPDATE
USING (
  sender_id = auth.uid()
  OR has_management_role(auth.uid(), 'admin'::management_role)
);

-- RPC function for safe message soft deletion
CREATE OR REPLACE FUNCTION public.soft_delete_message(_message_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  msg_sender_id uuid;
BEGIN
  -- Get message sender
  SELECT sender_id INTO msg_sender_id
  FROM public.messages
  WHERE id = _message_id;
  
  -- Check if message exists
  IF msg_sender_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user is sender or admin
  IF msg_sender_id = auth.uid() OR has_management_role(auth.uid(), 'admin'::management_role) THEN
    UPDATE public.messages
    SET deleted_at = now()
    WHERE id = _message_id;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- RPC function for updating message text
CREATE OR REPLACE FUNCTION public.update_message_text(_message_id uuid, _new_text text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow sender to edit their own non-deleted messages
  UPDATE public.messages
  SET 
    body_text = _new_text,
    edited_at = now()
  WHERE 
    id = _message_id
    AND sender_id = auth.uid()
    AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$;