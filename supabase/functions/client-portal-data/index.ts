import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, csrf_token } = await req.json();

    if (!session_id || !csrf_token) {
      return new Response(
        JSON.stringify({ error: 'Missing session_id or csrf_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify session
    const { data: session, error: sessionError } = await supabase
      .from('client_session_context')
      .select('*')
      .eq('id', session_id)
      .eq('csrf_token', csrf_token)
      .eq('revoked', false)
      .single();

    if (sessionError || !session) {
      console.error('Session verification failed:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session has expired
    if (new Date(session.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Session expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last activity
    await supabase
      .from('client_session_context')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', session_id);

    const eventId = session.event_id;

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('management_events')
      .select('id, event_name, event_date, event_time, headcount, event_type, status, notes')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      console.error('Event fetch failed:', eventError);
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from('client_messages')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Messages fetch failed:', messagesError);
    }

    // Fetch files
    const { data: files, error: filesError } = await supabase
      .from('client_files')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (filesError) {
      console.error('Files fetch failed:', filesError);
    }

    // Generate signed URLs for files
    const filesWithUrls = await Promise.all(
      (files || []).map(async (file) => {
        const { data: signedUrl } = await supabase.storage
          .from('client-files')
          .createSignedUrl(file.storage_path, 3600); // 1 hour expiry

        return {
          ...file,
          download_url: signedUrl?.signedUrl || null,
        };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        event,
        messages: messages || [],
        files: filesWithUrls,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in client-portal-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
