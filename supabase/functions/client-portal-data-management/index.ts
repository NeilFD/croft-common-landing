import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_id } = await req.json();

    if (!event_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Event ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user has management role by checking their JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check management role via RPC
    const { data: role } = await supabase.rpc('get_user_management_role', { _user_id: user.id });
    
    if (!role) {
      return new Response(
        JSON.stringify({ success: false, error: 'Insufficient permissions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log('[Management Portal Data] Fetching data for event:', event_id);

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('management_events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (eventError) throw eventError;

    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from('client_messages')
      .select('*')
      .eq('event_id', event_id)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Fetch files
    const { data: files, error: filesError } = await supabase
      .from('client_files')
      .select('*')
      .eq('event_id', event_id)
      .order('created_at', { ascending: false });

    if (filesError) throw filesError;

    // Generate signed URLs for file downloads
    const filesWithUrls = await Promise.all(
      (files || []).map(async (file) => {
        const { data } = await supabase.storage
          .from('client-files')
          .createSignedUrl(file.storage_path, 3600);

        return {
          ...file,
          download_url: data?.signedUrl || null,
        };
      })
    );

    // Fetch inspiration links
    const { data: inspirationLinks, error: inspirationError } = await supabase
      .from('client_inspiration_links')
      .select('*')
      .eq('event_id', event_id)
      .order('created_at', { ascending: false });

    if (inspirationError) throw inspirationError;

    // Fetch latest BEO
    const { data: beo, error: beoError } = await supabase
      .from('event_beo_versions')
      .select('*')
      .eq('event_id', event_id)
      .order('version_no', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (beoError) throw beoError;

    // Fetch latest proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposal_versions')
      .select('*')
      .eq('event_id', event_id)
      .order('version_no', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (proposalError) throw proposalError;

    // Fetch contract
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('event_id', event_id)
      .maybeSingle();

    if (contractError) throw contractError;

    return new Response(
      JSON.stringify({
        success: true,
        event,
        messages: messages || [],
        files: filesWithUrls || [],
        inspirationLinks: inspirationLinks || [],
        beo,
        proposal,
        contract,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Management Portal Data] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
