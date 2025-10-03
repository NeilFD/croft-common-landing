-- Check and fix messages policies - drop ALL old policies and create clean ones

-- Drop all existing message policies to avoid conflicts
drop policy if exists "Users can view messages in their chats" on public.messages;
drop policy if exists "Management can view messages in system chats" on public.messages;
drop policy if exists "Users can send messages in their chats" on public.messages;
drop policy if exists "Users can view messages via can_view_chat" on public.messages;
drop policy if exists "Members can insert messages" on public.messages;

-- Create single clean SELECT policy
create policy "Anyone can view messages in accessible chats"
  on public.messages
  for select
  using (public.can_view_chat(auth.uid(), chat_id));

-- Create single clean INSERT policy
create policy "Members can send messages"
  on public.messages
  for insert
  with check (
    public.is_chat_member(chat_id, auth.uid())
    and sender_id = auth.uid()
  );

-- Allow senders to update their own messages
create policy "Senders can update own messages"
  on public.messages
  for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

-- Allow senders or admins to soft-delete messages
create policy "Senders can delete own messages"
  on public.messages
  for update
  using (
    sender_id = auth.uid() 
    or public.is_chat_admin(chat_id, auth.uid())
  )
  with check (true);
