-- Update get_chat_messages to run as SECURITY INVOKER so RLS evaluates with caller context
create or replace function public.get_chat_messages(_chat_id uuid)
returns setof public.messages
language sql
stable
security invoker
set search_path = public
as $$
  select m.*
  from public.messages m
  where m.chat_id = _chat_id
    and m.deleted_at is null
    and (
      public.can_view_chat(auth.uid(), _chat_id)
      or (
        public.get_user_management_role(auth.uid()) is not null
        and exists (
          select 1 from public.chats c
          where c.id = _chat_id and c.is_system = true
        )
      )
    )
  order by m.created_at asc;
$$;