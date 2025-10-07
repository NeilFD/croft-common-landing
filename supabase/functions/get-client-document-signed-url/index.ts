import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  session_id: string;
  csrf_token: string;
  document_type: 'beo' | 'contract';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { session_id, csrf_token, document_type }: RequestBody = await req.json();

    console.log('[Get Client Document] Request:', { session_id, document_type });

    // Validate session
    const { data: sessionData, error: sessionError } = await supabase
      .from('client_session_context')
      .select('event_id, contact_email, expires_at, revoked, csrf_token')
      .eq('id', session_id)
      .single();

    if (sessionError || !sessionData) {
      console.error('[Get Client Document] Session error:', sessionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (sessionData.revoked) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session revoked' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (new Date(sessionData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (sessionData.csrf_token !== csrf_token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid CSRF token' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const eventId = sessionData.event_id;
    let bucket: string;
    let storagePath: string | null = null;

    // Get the appropriate document
    if (document_type === 'beo') {
      const { data: beoData, error: beoError } = await supabase
        .from('event_beo_versions')
        .select('pdf_url')
        .eq('event_id', eventId)
        .order('version_no', { ascending: false })
        .limit(1)
        .single();

      if (beoError || !beoData?.pdf_url) {
        return new Response(
          JSON.stringify({ success: false, error: 'BEO not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      bucket = 'beo-documents';
      // Extract path from URL: /storage/v1/object/public/beo-documents/{path}
      const urlParts = beoData.pdf_url.split('/beo-documents/');
      storagePath = urlParts[1] || null;
      
    } else if (document_type === 'contract') {
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('pdf_url')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (contractError || !contractData?.pdf_url) {
        return new Response(
          JSON.stringify({ success: false, error: 'Contract not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      bucket = 'contracts';
      // Extract path from URL
      const urlParts = contractData.pdf_url.split('/contracts/');
      storagePath = urlParts[1] || null;
    }

    if (!storagePath) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid document path' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove any query parameters from the path
    storagePath = storagePath.split('?')[0];

    console.log('[Get Client Document] Generating signed URL:', { bucket, storagePath });

    // Generate signed URL (1 hour expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from(bucket)
      .createSignedUrl(storagePath, 3600); // 1 hour

    if (signedUrlError) {
      console.error('[Get Client Document] Signed URL error:', signedUrlError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to generate signed URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        signedUrl: signedUrlData.signedUrl,
        expiresIn: 3600,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[Get Client Document] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
