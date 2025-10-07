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
    const { session_id, csrf_token, url } = await req.json();

    if (!session_id || !csrf_token || !url) {
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

    // Detect link type and extract metadata
    let linkType = 'web';
    let title = null;
    let description = null;
    let thumbnailUrl = null;

    if (url.includes('instagram.com') || url.includes('instagr.am')) {
      linkType = 'instagram';
      // Try to fetch Instagram metadata
      try {
        const response = await fetch(url);
        const html = await response.text();
        
        // Extract Open Graph metadata
        const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
        const ogDescMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
        const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        
        if (ogTitleMatch) title = ogTitleMatch[1];
        if (ogDescMatch) description = ogDescMatch[1];
        if (ogImageMatch) thumbnailUrl = ogImageMatch[1];
      } catch (error) {
        console.log('[client-add-inspiration] Could not fetch Instagram metadata:', error);
      }
    } else if (url.includes('pinterest.com') || url.includes('pin.it')) {
      linkType = 'pinterest';
      // Try to fetch Pinterest metadata
      try {
        const response = await fetch(url);
        const html = await response.text();
        
        const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
        const ogDescMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
        const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        
        if (ogTitleMatch) title = ogTitleMatch[1];
        if (ogDescMatch) description = ogDescMatch[1];
        if (ogImageMatch) thumbnailUrl = ogImageMatch[1];
      } catch (error) {
        console.log('[client-add-inspiration] Could not fetch Pinterest metadata:', error);
      }
    }

    // Insert inspiration link
    const { data: link, error: insertError } = await supabase
      .from('client_inspiration_links')
      .insert({
        event_id: session.event_id,
        url,
        link_type: linkType,
        title,
        description,
        thumbnail_url: thumbnailUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert failed:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to add inspiration link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, link }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in client-add-inspiration:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
