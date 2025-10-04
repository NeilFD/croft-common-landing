-- Restore missing RLS policies for messages table

-- Allow chat members to insert messages
CREATE POLICY "Chat members can insert messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_id = messages.chat_id 
    AND user_id = auth.uid()
  )
);

-- Allow users to update their own messages
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Allow users to delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (sender_id = auth.uid());