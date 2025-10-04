-- Update delete policy for messages to allow sender or admin to soft-delete
DROP POLICY IF EXISTS "Users can soft-delete their own messages" ON public.messages;

CREATE POLICY "Users can delete own messages or admins can delete any" 
ON public.messages 
FOR UPDATE 
USING (
  (sender_id = auth.uid()) OR 
  (has_management_role(auth.uid(), 'admin'::management_role) AND EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_id = messages.chat_id AND user_id = auth.uid()
  ))
)
WITH CHECK (
  (sender_id = auth.uid()) OR 
  (has_management_role(auth.uid(), 'admin'::management_role) AND EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_id = messages.chat_id AND user_id = auth.uid()
  ))
);