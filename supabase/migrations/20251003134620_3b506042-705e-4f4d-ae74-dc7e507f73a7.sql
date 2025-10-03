-- Re-run with safe drops before creates

-- 1) Helper functions (idempotent)
create or replace function public.is_chat_member(_chat_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_members cm
    where cm.chat_id = _chat_id and cm.user_id = _user_id
  );
$$;

create or replace function public.is_chat_admin(_chat_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_members cm
    where cm.chat_id = _chat_id and cm.user_id = _user_id and cm.is_admin = true
  );
$$;

create or replace function public.can_view_chat(_user_id uuid, _chat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- True if the user is a member of the chat OR the chat is a system chat and the user has a management role
  select (
    exists (
      select 1 from public.chat_members cm
      where cm.chat_id = _chat_id and cm.user_id = _user_id
    )
  )
  or (
    exists (
      select 1 from public.chats c
      where c.id = _chat_id and c.is_system = true
    )
    and public.get_user_management_role(_user_id) is not null
  );
$$;

-- 2) Policies
alter table public.chats enable row level security;

-- Replace SELECT policies on chats
drop policy if exists "Users can view chats via can_view_chat" on public.chats;
drop policy if exists "Management can view system chats" on public.chats;
drop policy if exists "Users can view chats they belong to" on public.chats;

create policy "Users can view chats via can_view_chat"
  on public.chats
  for select
  using (public.can_view_chat(auth.uid(), id));

alter table public.chat_members enable row level security;

-- Replace SELECT policies on chat_members
drop policy if exists "Users can view members via can_view_chat" on public.chat_members;
drop policy if exists "Management can view members of system chats" on public.chat_members;
drop policy if exists "Users can view members of their chats" on public.chat_members;

create policy "Users can view members via can_view_chat"
  on public.chat_members
  for select
  using (public.can_view_chat(auth.uid(), chat_id));

-- messages policies
alter table public.messages enable row level security;

drop policy if exists "Users can view messages via can_view_chat" on public.messages;
drop policy if exists "Members can insert messages" on public.messages;

create policy "Users can view messages via can_view_chat"
  on public.messages
  for select
  using (public.can_view_chat(auth.uid(), chat_id));

create policy "Members can insert messages"
  on public.messages
  for insert
  with check (
    public.is_chat_member(chat_id, auth.uid())
    and sender_id = auth.uid()
  );
