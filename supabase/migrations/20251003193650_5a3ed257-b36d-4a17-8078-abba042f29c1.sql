-- Restore execute privileges after function recreation
GRANT EXECUTE ON FUNCTION public.get_chat_messages(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_chat_messages(uuid) TO anon;