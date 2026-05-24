-- 1. events.contact_email: revoke column SELECT from anon
REVOKE SELECT (contact_email) ON public.events FROM anon;

-- 2 & 4. Remove management-only tables from supabase_realtime publication
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'client_messages','chats','chat_members','messages',
    'marketing_posts','marketing_comments','marketing_status_log',
    'moment_comments','moment_comment_reactions'
  ] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
    EXCEPTION WHEN undefined_object OR undefined_table THEN
      NULL;
    END;
  END LOOP;
END $$;

-- 2. RLS on realtime.messages (broadcast/presence) — auth required
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated can receive broadcasts" ON realtime.messages;
CREATE POLICY "authenticated can receive broadcasts"
ON realtime.messages FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "authenticated can send broadcasts" ON realtime.messages;
CREATE POLICY "authenticated can send broadcasts"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (true);

-- 3. notifications: tighten UPDATE to own rows only
DROP POLICY IF EXISTS "Users can mark notifications as read" ON public.notifications;
CREATE POLICY "Users can mark their own notifications as read"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. lunch_orders: allow management staff to read all orders
DROP POLICY IF EXISTS "Management can view all lunch orders" ON public.lunch_orders;
CREATE POLICY "Management can view all lunch orders"
ON public.lunch_orders FOR SELECT TO authenticated
USING (
  public.has_management_role(auth.uid(), 'admin')
  OR public.has_management_role(auth.uid(), 'sales')
  OR public.has_management_role(auth.uid(), 'ops')
);