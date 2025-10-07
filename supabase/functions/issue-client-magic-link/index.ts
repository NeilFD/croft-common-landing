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

    // Verify event exists and user has access
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

    // Check management role
    const { data: roleData } = await supabase.rpc('get_user_management_role', { _user_id: user.id });
    
    if (!roleData || !['admin', 'sales'].includes(roleData)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get event details (use maybeSingle to avoid throwing)
    console.log('issue-client-magic-link: fetching event', { event_id });
    const { data: event, error: eventError } = await supabase
      .from('management_events')
      .select('id, event_type, client_name, client_email, primary_date')
      .eq('id', event_id)
      .maybeSingle();

    if (eventError) {
      console.error('issue-client-magic-link: event fetch error', eventError);
    }

    if (!event) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate magic token and event code
    const magicToken = crypto.randomUUID();
    const eventCode = `EVT-${Date.now().toString(36).toUpperCase()}`;
    
    // Hash the token for storage
    const encoder = new TextEncoder();
    const data = encoder.encode(magicToken);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const magicTokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 7-day expiry
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Revoke any existing active tokens for this event, then insert a new one
    console.log('issue-client-magic-link: revoking existing tokens (if any)');
    const { data: revokedRows, error: revokeError } = await supabase
      .from('client_access')
      .update({ revoked: true })
      .eq('event_id', event_id)
      .eq('revoked', false)
      .select('id');

    if (revokeError) {
      console.error('issue-client-magic-link: error revoking existing tokens', revokeError);
      // Do not fail the whole request if revoke fails for zero rows; continue to try insert
    } else {
      console.log('issue-client-magic-link: revoked count', revokedRows?.length ?? 0);
    }

    console.log('issue-client-magic-link: inserting new client access record');
    const { error: insertError } = await supabase
      .from('client_access')
      .insert({
        event_id,
        event_code: eventCode,
        magic_token_hash: magicTokenHash,
        token_expires_at: tokenExpiresAt,
        created_by: user.id,
        revoked: false
      });

    if (insertError) {
      console.error('issue-client-magic-link: error creating client access', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create access' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log audit
    await supabase.rpc('log_audit_entry', {
      p_entity_id: event_id,
      p_entity: 'client_portal',
      p_action: 'magic_link_issued',
      p_actor_id: user.id,
      p_diff: { event_code: eventCode, expires_at: tokenExpiresAt }
    });

    // Generate portal link
    const portalUrl = `https://www.croftcommontest.com/client-login?c=${eventCode}&t=${magicToken}`;

    // TODO: Send email via Resend with branded template
    console.log('Portal link generated:', portalUrl);
    console.log('For event type:', event.event_type);
    console.log('Client:', event.client_name, event.client_email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        portal_url: portalUrl,
        event_code: eventCode,
        expires_at: tokenExpiresAt
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in issue-client-magic-link:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});