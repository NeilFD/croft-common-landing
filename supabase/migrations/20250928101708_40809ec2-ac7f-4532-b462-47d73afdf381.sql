-- Ensure RPC is callable by client roles
GRANT EXECUTE ON FUNCTION public.create_proposal(uuid, jsonb, numeric) TO anon, authenticated;