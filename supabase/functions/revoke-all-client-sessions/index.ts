import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { event_id } = await req.json();

    if (!event_id) {
      return new Response(
        JSON.stringify({ error: 'event_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has admin or sales role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roleData } = await supabase.rpc('get_user_management_role', { _user_id: user.id });
    
    if (!roleData || !['admin', 'sales'].includes(roleData)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Revoke all sessions for this event
    const { error: sessionError } = await supabase
      .from('client_session_context')
      .update({ revoked: true })
      .eq('event_id', event_id)
      .eq('revoked', false);

    if (sessionError) {
      console.error('Error revoking sessions:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to revoke sessions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also revoke the access link
    const { error: accessError } = await supabase
      .from('client_access')
      .update({ revoked: true })
      .eq('event_id', event_id);

    if (accessError) {
      console.error('Error revoking access:', accessError);
    }

    // Log audit
    await supabase.rpc('log_audit_entry', {
      p_entity_id: event_id,
      p_entity: 'client_portal',
      p_action: 'sessions_revoked',
      p_actor_id: user.id,
      p_diff: null
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in revoke-all-client-sessions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});