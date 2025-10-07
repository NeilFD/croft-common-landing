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
    const { session_id, csrf_token, link_id } = await req.json();

    if (!session_id || !csrf_token || !link_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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
      .select('event_id')
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

    // Update last activity
    await supabase
      .from('client_session_context')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', session_id);

    // Verify the link belongs to this event before deleting
    const { data: link, error: linkError } = await supabase
      .from('client_inspiration_links')
      .select('event_id')
      .eq('id', link_id)
      .single();

    if (linkError || !link) {
      return new Response(
        JSON.stringify({ error: 'Inspiration link not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (link.event_id !== session.event_id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorised to delete this link' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete the link
    const { error: deleteError } = await supabase
      .from('client_inspiration_links')
      .delete()
      .eq('id', link_id);

    if (deleteError) {
      console.error('Delete failed:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete inspiration link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in client-delete-inspiration:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
