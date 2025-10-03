-- Create a secure RPC to create a chat and add the creator as admin (atomic)
-- This avoids RLS pitfalls by using a SECURITY DEFINER function and validates management role

create or replace function public.create_group_chat(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_chat_id uuid;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Require a management role
  if public.get_user_management_role(uid) is null then
    raise exception 'Not authorised';
  end if;

  -- Insert chat
  insert into public.chats (type, name, created_by)
  values ('group', trim(p_name), uid)
  returning id into new_chat_id;

  -- Add creator as admin member
  insert into public.chat_members (chat_id, user_id, is_admin)
  values (new_chat_id, uid, true);

  return new_chat_id;
end;
$$;

-- Allow authenticated users to execute the function
grant execute on function public.create_group_chat(text) to authenticated;