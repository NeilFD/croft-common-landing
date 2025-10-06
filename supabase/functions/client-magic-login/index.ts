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

    const { event_code, token, user_agent, ip } = await req.json();

    if (!event_code || !token) {
      return new Response(
        JSON.stringify({ error: 'event_code and token are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash the provided token
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Verify token
    const { data: accessData, error: accessError } = await supabase
      .from('client_access')
      .select('*')
      .eq('event_code', event_code)
      .eq('magic_token_hash', tokenHash)
      .single();

    if (accessError || !accessData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired link' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiry and revocation
    if (accessData.revoked || new Date(accessData.token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Link has expired or been revoked' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, client_email, client_name')
      .eq('id', accessData.event_id)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create session fingerprint for hijacking prevention
    const fingerprintData = `${user_agent || 'unknown'}-${ip || 'unknown'}`;
    const fpBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(fingerprintData));
    const fpArray = Array.from(new Uint8Array(fpBuffer));
    const sessionFingerprint = fpArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Hash IP for privacy
    const ipBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(ip || 'unknown'));
    const ipArray = Array.from(new Uint8Array(ipBuffer));
    const ipHash = ipArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Generate CSRF token
    const csrfToken = crypto.randomUUID();

    // Create persistent session (30 days)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: session, error: sessionError } = await supabase
      .from('client_session_context')
      .insert({
        event_id: accessData.event_id,
        contact_email: event.client_email,
        user_agent: user_agent || null,
        ip_hash: ipHash,
        session_fingerprint: sessionFingerprint,
        csrf_token: csrfToken,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (sessionError || !session) {
      console.error('Session creation error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log audit
    await supabase.rpc('log_audit_entry', {
      p_entity_id: accessData.event_id,
      p_entity: 'client_portal',
      p_action: 'client_login',
      p_actor_id: null,
      p_diff: { session_id: session.id, contact_email: event.client_email }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        session_id: session.id,
        event_id: accessData.event_id,
        csrf_token: csrfToken,
        expires_at: expiresAt,
        event_code: event_code
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Set-Cookie': `client_session=${session.id}; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}; Path=/`
        } 
      }
    );

  } catch (error: any) {
    console.error('Error in client-magic-login:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});